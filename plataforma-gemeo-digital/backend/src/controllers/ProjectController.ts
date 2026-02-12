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

  public async uploadAndProcessImage(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const imagePath = req.file.path;

    const imageProcessingService = new ImageProcessingService();
    try {
      const processedImageResponse = await imageProcessingService.processImage(imagePath);
      
      // Clean up the uploaded file after processing
      await fs.promises.unlink(imagePath);

      return res.json(processedImageResponse); // Return JSON response
    } catch (error) {
      // Clean up the uploaded file in case of an error
      await fs.promises.unlink(imagePath);

      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error during image processing.' });
    }
  }

  public async saveProcessedImage(req: AuthRequest, res: Response): Promise<Response> {
    const { id: projectId } = req.params;
    const { inspectionId, detections: detectionsString, imageData } = req.body;

    if (!imageData) {
      console.error('No image data (base64) received in saveProcessedImage.');
      return res.status(400).json({ error: 'Nenhum dado de imagem (base64) enviado.' });
    }

    if (!inspectionId) {
      return res.status(400).json({ error: 'O ID da inspeção é obrigatório para salvar a imagem.' });
    }

    let detections: IDetection[] | undefined;
    if (detectionsString) {
      try {
        detections = JSON.parse(detectionsString);
      } catch (e) {
        console.error("Failed to parse detections string:", e);
      }
    }

    const projectRepository = new ProjectRepository();
    const project = await projectRepository.findById(projectId);

    if (!project) {
      console.error(`Project not found: ${projectId}`);
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    // Find the inspection
    let targetInspection = project.inspections?.find(inspection => inspection.id === inspectionId);
    if (!targetInspection) {
      return res.status(404).json({ error: `Inspeção com ID "${inspectionId}" não encontrada.` });
    }

    const processedImagesDir = path.resolve(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      'processed_images',
      projectId,
      inspectionId // Usar o ID da inspeção como pasta para organizar
    );

    await fs.promises.mkdir(processedImagesDir, { recursive: true });

    // Decodificar a base64 e salvar
    const base64Data = imageData.replace(/^data:image\/png;base64,/, ""); // Remover o cabeçalho data URI
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const newFileName = `${Date.now()}.png`; // Nome fixo ou gerar um nome melhor
    const destinationPath = path.join(processedImagesDir, newFileName);
    const relativePath = `/files/processed_images/${projectId}/${inspectionId}/${newFileName}`;

    try {
      await fs.promises.writeFile(destinationPath, imageBuffer); // Salvar o buffer no arquivo

      const newImage: IImage = {
        url: relativePath,
        detections: detections
      };

      const updatedInspections = project.inspections?.map(inspection => {
        if (inspection.id === inspectionId) {
          return {
            ...inspection,
            images: [...inspection.images, newImage],
          };
        }
        return inspection;
      }) || []; // Se não houver inspeções, retorna array vazio

      await projectRepository.update(projectId, { inspections: updatedInspections });

      return res.status(200).json({ message: 'Imagem processada salva com sucesso na inspeção.', image: newImage });
    } catch (error) {
      console.error('Erro ao salvar imagem processada na inspeção:', error);
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor ao salvar imagem processada.' });
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