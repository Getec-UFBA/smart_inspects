import ProjectRepository from '../repositories/ProjectRepository';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { IProject, IInspection, IDetection, IImage } from '../models/IProject';

class ReportService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  public async generatePdfReport(projectId: string, inspectionId?: string): Promise<Buffer> {
    console.log(`[ReportService] Iniciando geração de PDF para projeto ${projectId}${inspectionId ? `, inspeção ${inspectionId}` : ''}`);
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error('Projeto não encontrado para gerar o relatório.');
    }

    const htmlContent = this.generateHtmlReport(project, inspectionId);
    
    // Criar um arquivo temporário para o HTML
    const tempDir = path.join(__dirname, '..', '..', 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `report_${projectId}_${Date.now()}.html`);
    fs.writeFileSync(tempFilePath, htmlContent);

    console.log('[ReportService] HTML gerado e salvo em arquivo temporário, iniciando Puppeteer...');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files'
      ]
    });

    try {
      const page = await browser.newPage();
      
      await page.setDefaultNavigationTimeout(120000);
      await page.setDefaultTimeout(120000);

      console.log('[ReportService] Carregando arquivo HTML temporário no Puppeteer...');
      const fileUrl = pathToFileURL(tempFilePath).href;
      await page.goto(fileUrl, { 
        waitUntil: 'networkidle0',
        timeout: 120000 
      });

      console.log('[ReportService] Gerando buffer do PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '10mm',
          right: '10mm',
        },
        timeout: 120000,
      });

      console.log('[ReportService] PDF gerado com sucesso.');
      return pdfBuffer;
    } catch (error) {
      console.error('[ReportService] Erro durante o processamento do Puppeteer:', error);
      throw error;
    } finally {
      await browser.close();
      // Remover o arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error('[ReportService] Erro ao remover arquivo temporário:', unlinkError);
        }
      }
    }
  }

  private generateHtmlReport(project: IProject, targetInspectionId?: string): string {
    let targetInspection: IInspection | undefined;

    if (targetInspectionId) {
      targetInspection = project.inspections?.find(inspection => inspection.id === targetInspectionId);
    } else {
      targetInspection = project.inspections?.[0]; 
    }

    let totalDefects = 0;
    const defectsByClass: { [key: string]: number } = {};

    const inspectionsToReport = targetInspection ? [targetInspection] : (project.inspections || []);

    inspectionsToReport.forEach(inspection => {
        inspection.images.forEach(image => {
          let detections = image.detections;
          if (typeof detections === 'string') {
            try {
              detections = JSON.parse(detections);
            } catch (error) {
              detections = [];
            }
          }

          if (detections && Array.isArray(detections)) {
            totalDefects += detections.length;
            detections.forEach(detection => {
              defectsByClass[detection.class_name] = (defectsByClass[detection.class_name] || 0) + 1;
            });
          }
        });
    });

    let defectsByClassHtml = '';
    if (Object.keys(defectsByClass).length > 0) {
      defectsByClassHtml = `
        <p><strong>Defeitos por Classe:</strong></p>
        <ul>
          ${Object.entries(defectsByClass).map(([className, count]) => `
            <li>${className}: ${count}</li>
          `).join('')}
        </ul>
      `;
    } else {
      defectsByClassHtml = '<p>Nenhum defeito classificado encontrado.</p>';
    }

    let inspectionsHtml = '';
    if (inspectionsToReport.length > 0) {
      inspectionsHtml = inspectionsToReport.map(inspection => {
        let imagesHtml = '';
        if (inspection.images && inspection.images.length > 0) {
          imagesHtml = inspection.images.map(image => {
            let detections = image.detections;
            if (typeof detections === 'string') {
              try {
                detections = JSON.parse(detections);
              } catch (error) {
                detections = [];
              }
            }

            let detectionsHtml = 'Nenhuma detecção.';
            if (detections && Array.isArray(detections) && detections.length > 0) {
              detectionsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
                  <thead>
                    <tr>
                      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Classe</th>
                      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Confiança</th>
                      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Caixa (x1,y1,x2,y2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${detections.map(det => `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${det.class_name}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${(det.confidence * 100).toFixed(2)}%</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">(${det.box.x1.toFixed(0)},${det.box.y1.toFixed(0)},${det.box.x2.toFixed(0)},${det.box.y2.toFixed(0)})</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `;
            }

            let imgSrc = '';
            if (image.url && image.url.startsWith('/files/')) {
              try {
                const relativePath = image.url.replace('/files/', '');
                const absolutePath = path.resolve(__dirname, '..', '..', 'public', 'uploads', relativePath);
                
                if (fs.existsSync(absolutePath)) {
                  imgSrc = pathToFileURL(absolutePath).href;
                }
              } catch (err) {
                console.error(`[ReportService] Erro ao obter URL do arquivo: ${image.url}`, err);
              }
            }

            return `
              <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; page-break-inside: avoid;">
                <h4>Imagem: ${image.url ? path.basename(image.url) : 'Nome da imagem indisponível'}</h4>
                ${imgSrc ? `<img src="${imgSrc}" alt="Imagem Processada" style="max-width: 100%; height: auto; display: block; margin-bottom: 10px; border: 1px solid #ccc;">` : '<p style="color: red;">Imagem não pôde ser carregada.</p>'}
                <p><strong>Detecções YOLO:</strong></p>
                ${detectionsHtml}
              </div>
            `;
          }).join('');
        } else {
          imagesHtml = '<p>Nenhuma imagem nesta inspeção.</p>';
        }

        return `
          <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9;">
            <h2>Inspeção: ${inspection.inspectionObjective}</h2>
            <p><strong>Tipo:</strong> ${inspection.inspectionType}</p>
            <p><strong>Data:</strong> ${inspection.inspectionDate}</p>
            <p><strong>Responsável:</strong> ${inspection.inspectionResponsible}</p>
            ${imagesHtml}
          </div>
        `;
      }).join('');
    } else {
      inspectionsHtml = '<p>Nenhuma inspeção ou imagem processada neste projeto.</p>';
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Projeto - ${project.name}</title>
          <style>
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #333; }
              .header { background-color: #004d40; color: #ffffff; padding: 20px; text-align: center; }
              .header h1 { margin: 0; }
              .container { width: 90%; margin: 20px auto; }
              .section { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px; background-color: #fff; }
              h2, h3, h4 { color: #004d40; }
              img { max-width: 100%; height: auto; display: block; margin: 10px 0; border: 1px solid #ddd; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .footer { text-align: center; margin-top: 40px; font-size: 0.8em; color: #777; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Relatório de Projeto</h1>
              <p>${project.name}</p>
          </div>
          <div class="container">
              <div class="section">
                  <h2>Informações do Projeto</h2>
                  <p><strong>ID:</strong> ${project.id}</p>
                  <p><strong>Nome:</strong> ${project.name}</p>
                  <p><strong>Responsável:</strong> ${project.responsible}</p>
                  <p><strong>URL Modelo BIM:</strong> <a href="${project.bimModelUrl}">${project.bimModelUrl}</a></p>
                  <p><strong>Módulos Ativos:</strong> ${Object.keys(project.modules).filter(key => project.modules[key]).map(key => {
                    switch (key) {
                      case 'progress': return 'Progresso';
                      case 'security': return 'Segurança';
                      case 'maintenance': return 'Manutenção';
                      default: return key;
                    }
                  }).join(', ') || 'Nenhum'}</p>
                  ${project.modules.maintenance ? `
                    <h3>Informações de Manutenção</h3>
                    <p><strong>Ano Construído:</strong> ${project.buildingYear || 'Não informado'}</p>
                    <p><strong>Área Construída:</strong> ${project.builtArea || 'Não informado'} m²</p>
                    <p><strong>Tipologia da Fachada:</strong> ${project.facadeTypology || 'Não informado'}</p>
                    <p><strong>Tipologia da Cobertura:</strong> ${project.roofTypology || 'Não informado'}</p>
                  ` : ''}
              </div>
              <div class="section">
                  <h2>Informações Relevantes</h2>
                  <p><strong>Número de Defeitos Totais:</strong> ${totalDefects}</p>
                  ${defectsByClassHtml}
              </div>
              <div class="section">
                  <h2>Imagens Processadas e Detecções</h2>
                  ${inspectionsHtml}
              </div>
          </div>
          <div class="footer">
              <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
      </body>
      </html>
    `;
    return reportHtml;
  }
}

export default ReportService;
