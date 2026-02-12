import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import uploadConfig from '../config/upload';
import ProjectRepository from '../repositories/ProjectRepository';
import { IProject, IOAE, IInspection, IDetection, IImage } from '../models/IProject'; // Importar IInspection, IDetection, IImage

interface IFile {
  fieldname: string;
  filename: string;
}

interface ICreateRequest {
  userId: string;
  name: string;
  address: string;
  type: string;
  responsible: string;
  modules: string;
  oaeData: string;
  files: IFile[];
  buildingYear?: string;
  builtArea?: string;
  facadeTypology?: string;
  roofTypology?: string;
  buildingAcronym?: string;
  unitDirector?: string;
}

interface ICreateInspectionRequest {
  projectId: string;
  inspectionType: string;
  inspectionObjective: string;
  inspectionDate: string;
  inspectionResponsible: string;
}

class ProjectService {
  private projectRepository = new ProjectRepository();

  public async create({ 
    userId, 
    name, 
    address, 
    type, 
    responsible, 
    modules, 
    oaeData, 
    files,
    buildingYear, 
    builtArea,    
    facadeTypology, 
    roofTypology,  
    buildingAcronym, 
    unitDirector   
  }: ICreateRequest): Promise<IProject> {
    const coverImage = files.find(f => f.fieldname === 'coverImage');
    const bimModel = files.find(f => f.fieldname === 'bimModel');

    if (!coverImage || !bimModel) {
      throw new Error('Imagem de capa e modelo BIM principal são obrigatórios.');
    }

    const parsedModules = JSON.parse(modules);
    const parsedOaes = oaeData ? JSON.parse(oaeData) : [];

    const oaeBimModelFiles = files.filter(f => f.fieldname === 'oaeBimModel[]');

    const oaeWithFiles: IOAE[] = parsedOaes.map((oae: any, index: number) => {
      // Pega o arquivo correspondente na ordem
      const oaeFile = oaeBimModelFiles[index];
      if (!oaeFile) {
        // Isso pode acontecer se o número de arquivos enviados não corresponder ao número de OAEs
        throw new Error(`Arquivo BIM não encontrado para a OAE: ${oae.name}`);
      }
      return {
        id: uuidv4(),
        name: oae.name,
        bimModelUrl: oaeFile.filename,
      };
    });

    // Verificação adicional para garantir que todos os arquivos foram usados
    if (parsedOaes.length !== oaeBimModelFiles.length) {
      // Isso pode indicar uma inconsistência entre os dados do formulário e os arquivos enviados
      console.warn('O número de OAEs e de arquivos de modelo BIM não corresponde.');
      // Dependendo da regra de negócio, você pode querer lançar um erro aqui
      // throw new Error('Inconsistência nos dados das OAEs.');
    }

    const newProject: IProject = {
      id: uuidv4(),
      userId,
      name,
      address,
      type,
      responsible,
      coverImageUrl: coverImage.filename,
      bimModelUrl: bimModel.filename,
      modules: parsedModules,
      oae: oaeWithFiles,
    };

    // Adicionar campos de manutenção se o módulo estiver ativo
    if (parsedModules.maintenance) {
      newProject.buildingYear = buildingYear;
      newProject.builtArea = builtArea;
      newProject.facadeTypology = facadeTypology;
      newProject.roofTypology = roofTypology;
      newProject.buildingAcronym = buildingAcronym;
      newProject.unitDirector = unitDirector;
    }

    return this.projectRepository.create(newProject);
  }

  public async createInspection({
    projectId,
    inspectionType,
    inspectionObjective,
    inspectionDate,
    inspectionResponsible,
  }: ICreateInspectionRequest): Promise<IInspection> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Projeto não encontrado.');
    }

    if (project.inspections?.some(inspection => inspection.inspectionObjective === inspectionObjective)) {
      throw new Error(`A inspeção com objetivo "${inspectionObjective}" já existe.`);
    }

    const newInspection: IInspection = {
      id: uuidv4(),
      inspectionType,
      inspectionObjective,
      inspectionDate,
      inspectionResponsible,
      images: [], // Inspeção começa sem imagens
    };

    const updatedInspections = project.inspections ? [...project.inspections, newInspection] : [newInspection];

    await this.projectRepository.update(projectId, { inspections: updatedInspections });

    // Criar pasta no sistema de arquivos para armazenar imagens da inspeção
    const inspectionPath = path.resolve(
      uploadConfig.projectsDirectory, // Base path
      projectId,
      newInspection.id // Usar o ID da inspeção como nome da pasta
    );
    await fs.promises.mkdir(inspectionPath, { recursive: true });

    return newInspection;
  }

  public async delete({ projectId, userRole }: { projectId: string; userRole: 'admin' | 'user' }): Promise<void> {
    if (userRole !== 'admin') {
      throw new Error('Você não tem permissão para excluir este projeto.');
    }

    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Projeto não encontrado.');
    }

    const filesToDelete: string[] = [];
    if (project.coverImageUrl) filesToDelete.push(project.coverImageUrl);
    if (project.bimModelUrl) filesToDelete.push(project.bimModelUrl);
    if (project.oae) {
      project.oae.forEach(o => filesToDelete.push(o.bimModelUrl));
    }

    for (const filename of filesToDelete) {
      const filePath = path.join(uploadConfig.projectsDirectory, filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Falha ao excluir o arquivo ${filename}:`, err);
      }
    }

    await this.projectRepository.delete(projectId);
  }
}

export default ProjectService;
