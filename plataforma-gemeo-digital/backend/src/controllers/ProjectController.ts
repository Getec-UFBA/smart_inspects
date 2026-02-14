import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import ProjectService from '../services/ProjectService';
import ProjectRepository from '../repositories/ProjectRepository';
import ImageProcessingService from '../services/ImageProcessingService';
import path from 'path';
import uploadConfig from '../config/upload';
import fs from 'fs';
import ReportService from '../services/ReportService'; // Import ReportService
import { IDetection, IImage } from '../models/IProject'; // Importar interfaces do modelo


class ProjectController {
  public async index(req: AuthRequest, res: Response): Promise<Response> {
    const projectRepository = new ProjectRepository();
    const projects = await projectRepository.findAll();
    return res.json(projects);
  }

  public async show(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(id);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    return res.json(project);
  }

  public async create(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const { 
      name, 
      address, 
      type, 
      responsible, 
      modules, 
      oaeData,
      buildingYear, // Novo campo
      builtArea,    // Novo campo
      facadeTypology, // Novo campo
      roofTypology,  // Novo campo
      buildingAcronym, // Novo campo
      unitDirector   // Novo campo
    } = req.body;
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const allFiles = Object.values(files).flat().map(file => ({
      fieldname: file.fieldname,
      filename: file.filename
    }));
    
    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário não encontrado no token.' });
    }
    
    const projectService = new ProjectService();

    try {
      const project = await projectService.create({
        userId,
        name,
        address,
        type,
        responsible,
        modules,
        oaeData,
        files: allFiles,
        buildingYear,
        builtArea,
        facadeTypology,
        roofTypology,
        buildingAcronym, // Passar o novo campo
        unitDirector   // Passar o novo campo
      });
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  public async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data = req.body;

    // Ensure userId is not updated
    delete data.userId;

    const projectService = new ProjectService();

    try {
      const updatedProject = await projectService.update({ projectId: id, data });
      return res.json(updatedProject);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }


  public async delete(req: AuthRequest, res: Response): Promise<Response> {
    const userRole = req.userRole;
    const { id } = req.params;

    if (!userRole) {
      return res.status(400).json({ error: 'Role do usuário não encontrada no token.' });
    }

    const projectService = new ProjectService();

    try {
      await projectService.delete({ projectId: id, userRole });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  public async processImagesForResults(req: AuthRequest, res: Response): Promise<Response> {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo de imagem enviado.' });
    }

    const imageProcessingService = new ImageProcessingService();
    const processedImages: IImage[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const file of files) {
      try {
        const { processedImageUrl, detections } = await this.processImageFile(file.path, imageProcessingService);
        processedImages.push({
          url: processedImageUrl,
          detections,
        });
        // Clean up original file
        await fs.promises.unlink(file.path);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        errors.push({ fileName: file.originalname, error: error instanceof Error ? error.message : 'Unknown error' });
        // Clean up original file if processing failed
        await fs.promises.unlink(file.path);
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({
        message: 'Alguns arquivos não puderam ser processados.',
        processed: processedImages,
        errors: errors,
      });
    }

    return res.status(200).json({
      message: 'Imagens processadas com sucesso.',
      images: processedImages,
    });
  }

  public async saveImageToInspection(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId, inspectionId } = req.params;
    const { imageData, detections } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Nenhum dado de imagem (base64) enviado.' });
    }

    const projectService = new ProjectService();

    try {
      const newImage = await projectService.saveImageToInspection({
        projectId,
        inspectionId,
        imageData,
        detections: JSON.parse(detections),
      });
      return res.status(200).json({ message: 'Imagem salva com sucesso na inspeção.', image: newImage });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  public async uploadImagesToInspection(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId, inspectionId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo de imagem enviado.' });
    }

    if (!projectId || !inspectionId) {
      // Clean up uploaded files if projectId or inspectionId are missing
      await Promise.all(files.map(file => fs.promises.unlink(file.path)));
      return res.status(400).json({ error: 'ID do projeto e ID da inspeção são obrigatórios.' });
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);

    if (!project) {
      await Promise.all(files.map(file => fs.promises.unlink(file.path)));
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const targetInspection = project.inspections?.find(inspection => inspection.id === inspectionId);
    if (!targetInspection) {
      await Promise.all(files.map(file => fs.promises.unlink(file.path)));
      return res.status(404).json({ error: `Inspeção com ID "${inspectionId}" não encontrada no projeto "${projectId}".` });
    }

    const imageProcessingService = new ImageProcessingService();
    const processedImages: IImage[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const file of files) {
      const originalFilePath = file.path;
      const fileExtension = path.extname(file.originalname);
      const newFileName = `${Date.now()}-${file.filename}${fileExtension}`; // Use the Multer-generated name to ensure uniqueness
      
      const destinationDir = path.resolve(
        uploadConfig.projectsDirectory, // Base directory for projects
        '..', // Go up one level to 'uploads'
        'processed_images',
        projectId,
        inspectionId
      );
      
      const destinationPath = path.join(destinationDir, newFileName);
      const relativePath = `/files/processed_images/${projectId}/${inspectionId}/${newFileName}`;

      try {
        await fs.promises.mkdir(destinationDir, { recursive: true });
        await fs.promises.rename(originalFilePath, destinationPath); // Move the uploaded file

        const processed = await this.processImageFile(destinationPath, imageProcessingService);
        processedImages.push({
          url: relativePath,
          detections: processed.detections,
        });
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        errors.push({ fileName: file.originalname, error: error instanceof Error ? error.message : 'Unknown error' });
        // Attempt to clean up the moved file if processing failed
        try {
          await fs.promises.unlink(destinationPath);
        } catch (cleanupError) {
          console.error(`Failed to clean up ${destinationPath}:`, cleanupError);
        }
      }
    }

    if (processedImages.length > 0) {
      try {
        await new ProjectService().addImagesToInspection({
          projectId,
          inspectionId,
          images: processedImages,
        });
      } catch (error) {
        console.error('Error adding processed images to inspection:', error);
        return res.status(500).json({ error: 'Erro ao salvar imagens processadas na inspeção.' });
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({
        message: 'Alguns arquivos não puderam ser processados.',
        processed: processedImages,
        errors: errors,
      });
    }

    return res.status(200).json({
      message: 'Imagens processadas e salvas com sucesso na inspeção.',
      images: processedImages,
    });
  }


  // Helper function to process a single image file
  private async processImageFile(imagePath: string, imageProcessingService: ImageProcessingService): Promise<{ processedImageUrl: string; detections: IDetection[] }> {
    try {
      const processedImageResponse = await imageProcessingService.processImage(imagePath);
      const processedImageBuffer = Buffer.from(processedImageResponse.processed_image_base64, 'base64');
      
      const processedResultsFolder = path.resolve(uploadConfig.projectsDirectory, '..', 'processed_results');
      if (!fs.existsSync(processedResultsFolder)) {
        fs.mkdirSync(processedResultsFolder, { recursive: true });
      }

      const processedImageName = `processed-${path.basename(imagePath)}`;
      const processedImagePath = path.join(processedResultsFolder, processedImageName);
      await fs.promises.writeFile(processedImagePath, processedImageBuffer);

      const processedImageUrl = `/files/processed_results/${processedImageName}`;

      return {
        processedImageUrl: processedImageUrl,
        detections: processedImageResponse.detections,
      };
    } catch (error) {
      console.error(`Error processing image ${imagePath}:`, error);
      throw new Error(`Failed to process image ${imagePath}.`);
    }
  }

  public async createInspection(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId } = req.params;
    const { inspectionType, inspectionObjective, inspectionDate, inspectionResponsible } = req.body;

    if (!projectId || !inspectionObjective.trim() || !inspectionDate || !inspectionResponsible.trim()) {
      return res.status(400).json({ error: 'ID do projeto, objetivo, data e responsável pela inspeção são obrigatórios.' });
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const projectService = new ProjectService();
    try {
      const newInspection = await projectService.createInspection({
        projectId,
        inspectionType,
        inspectionObjective,
        inspectionDate,
        inspectionResponsible,
      });
      return res.status(201).json(newInspection);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  public async deleteImageFromInspection(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId, inspectionId, imageName } = req.params;

    if (!projectId || !inspectionId || !imageName) {
      return res.status(400).json({ error: 'ID do projeto, ID da inspeção e nome da imagem são obrigatórios.' });
    }

    const imagePath = path.resolve(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      'processed_images',
      projectId,
      inspectionId, // Usar o ID da inspeção como pasta
      imageName
    );

    const relativePath = `/files/processed_images/${projectId}/${inspectionId}/${imageName}`;

    try {
      // 1. Delete the file from the filesystem
      await fs.promises.unlink(imagePath);

      // 2. Remove the image path from the inspection's images array
      const projectRepository = new ProjectRepository();
      const project = await projectRepository.findById(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado.' });
      }

      const updatedInspections = project.inspections?.map(inspection => {
        if (inspection.id === inspectionId) {
          return {
            ...inspection,
            images: inspection.images.filter(img => img.url !== relativePath),
          };
        }
        return inspection;
      }) || [];

      await projectRepository.update(projectId, { inspections: updatedInspections });

      return res.status(204).send(); // No content to send back
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Erro ao excluir imagem ${imageName} da inspeção ${inspectionId} do projeto ${projectId}:`, error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          // File not found, proceed to remove from DB if it somehow still exists there
          const projectRepository = new ProjectRepository();
          const project = await projectRepository.findById(projectId);

          if (project) {
            const updatedInspections = project.inspections?.map(inspection => {
              if (inspection.id === inspectionId) {
                return {
                  ...inspection,
                  images: inspection.images.filter(img => img.url !== relativePath),
                };
              }
              return inspection;
            }) || [];
            await projectRepository.update(projectId, { inspections: updatedInspections });
            return res.status(200).json({ message: 'Arquivo não encontrado no sistema de arquivos, mas a referência foi removida do projeto.' });
          }
        }
        return res.status(500).json({ error: `Erro ao excluir imagem: ${error.message}` });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao excluir imagem.' });
    }
  }

  public async deleteInspection(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId, inspectionId } = req.params;

    if (!projectId || !inspectionId) {
      return res.status(400).json({ error: 'ID do projeto e ID da inspeção são obrigatórios.' });
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const inspectionToDelete = project.inspections?.find(inspection => inspection.id === inspectionId);

    if (!inspectionToDelete) {
      return res.status(404).json({ error: `Inspeção com ID "${inspectionId}" não encontrada.` });
    }

    const inspectionPath = path.resolve(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      'processed_images',
      projectId,
      inspectionId // Usar o ID da inspeção como pasta
    );

    try {
      // 1. Delete the folder and its contents from the filesystem
      await fs.promises.rm(inspectionPath, { recursive: true, force: true });

      // 2. Remove the inspection from the project's inspections array
      const updatedInspections = project.inspections?.filter(inspection => inspection.id !== inspectionId);

      await projectRepository.update(projectId, { inspections: updatedInspections });

      return res.status(204).send(); // No content to send back
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Erro ao excluir inspeção ${inspectionId} do projeto ${projectId}:`, error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          // Inspection folder not found in filesystem, but might exist in DB. Remove from DB.
          const updatedInspections = project.inspections?.filter(inspection => inspection.id !== inspectionId);
          await projectRepository.update(projectId, { inspections: updatedInspections });
          return res.status(200).json({ message: 'Pasta da inspeção não encontrada no sistema de arquivos, mas a referência foi removida do projeto.' });
        }
        return res.status(500).json({ error: `Erro ao excluir inspeção: ${error.message}` });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao excluir inspeção.' });
    }
  }

  public async generateInspectionPdfReport(req: AuthRequest, res: Response): Promise<Response> {
    const { projectId, inspectionId } = req.params;

    const reportService = new ReportService();

    try {
      const pdfBuffer = await reportService.generatePdfReport(projectId, inspectionId); // Passar inspectionId
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-inspecao-${inspectionId}.pdf`);
      return res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error(`Erro ao gerar relatório PDF para a inspeção ${inspectionId} do projeto ${projectId}:`, error);
      if (error instanceof Error) {
        return res.status(500).json({ error: `Erro ao gerar relatório: ${error.message}` });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao gerar relatório PDF.' });
    }
  }
}

export default ProjectController;