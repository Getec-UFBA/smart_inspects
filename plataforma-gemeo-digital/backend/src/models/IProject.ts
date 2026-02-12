export interface IOAE {
  id: string;
  name: string;
  bimModelUrl: string;
}

export interface IDetection {
  class_name: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

export interface IImage {
  url: string;
  detections?: IDetection[];
}

// Nova interface IInspection (substitui IFolder)
export interface IInspection {
  id: string; // Adicionar ID para a inspeção
  inspectionType: string;
  inspectionObjective: string;
  inspectionDate: string;
  inspectionResponsible: string;
  images: IImage[];
}

export interface IProject {
  id: string;
  userId: string; // Para saber a quem o projeto pertence
  name: string;
  address: string;
  type: string;
  responsible: string;
  coverImageUrl: string;
  modules: {
    progress: boolean;
    security: boolean;
    maintenance: boolean;
  };
  bimModelUrl: string;
  oae?: IOAE[];
  // Campo para o link do Omniverse no futuro
  omniverseLink?: string;
  processedImages?: string[];
  // Campos de manutenção
  buildingYear?: string;
  builtArea?: string;
  facadeTypology?: string;
  roofTypology?: string;
  // Novos campos de cadastro geral para manutenção
  buildingAcronym?: string;
  unitDirector?: string;
  // Propriedade para inspeções (substitui folders)
  inspections?: IInspection[];
}
