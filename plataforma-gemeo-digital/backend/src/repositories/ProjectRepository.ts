import fs from 'fs/promises';
import path from 'path';
import { IProject } from '../models/IProject';

const DB_PATH = path.resolve(__dirname, '../../db.json');

interface IDB {
  users: any[]; // Não nos preocupamos com users aqui
  projects: IProject[];
}

class ProjectRepository {
  private async readDB(): Promise<IDB> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { users: [], projects: [] };
      }
      throw error;
    }
  }

  private async writeDB(data: IDB): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  public async findAll(): Promise<IProject[]> {
    const db = await this.readDB();
    return db.projects;
  }

  public async findByUserId(userId: string): Promise<IProject[]> {
    const db = await this.readDB();
    return db.projects.filter(project => project.userId === userId);
  }

  public async findById(projectId: string): Promise<IProject | undefined> {
    const db = await this.readDB();
    return db.projects.find(project => project.id === projectId);
  }

  public async create(projectData: IProject): Promise<IProject> {
    const db = await this.readDB();
    db.projects.push(projectData);
    await this.writeDB(db);
    return projectData;
  }

  public async delete(projectId: string): Promise<void> {
    const db = await this.readDB();
    const updatedProjects = db.projects.filter(project => project.id !== projectId);
    db.projects = updatedProjects;
    await this.writeDB(db);
  }

  public async update(projectId: string, updatedData: Partial<IProject>): Promise<IProject | undefined> {
    const db = await this.readDB();
    const projectIndex = db.projects.findIndex(project => project.id === projectId);

    if (projectIndex === -1) {
      return undefined;
    }

    db.projects[projectIndex] = { ...db.projects[projectIndex], ...updatedData };
    await this.writeDB(db);
    return db.projects[projectIndex];
  }
}

export default ProjectRepository;
