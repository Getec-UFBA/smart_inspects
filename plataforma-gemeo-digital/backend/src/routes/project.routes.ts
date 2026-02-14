import { Router } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload';
import ProjectController from '../controllers/ProjectController';
import { authenticateToken, authorizeRole } from '../middlewares/auth';

const projectRouter = Router();
const uploadProjects = multer({ storage: uploadConfig.storage(uploadConfig.projectsDirectory) });
const upload = multer({ storage: uploadConfig.storage(uploadConfig.projectsDirectory) }); // New multer instance for single upload
const projectController = new ProjectController();

// Todas as rotas de projeto precisam de autenticação
projectRouter.use(authenticateToken);

projectRouter.get('/', projectController.index.bind(projectController));
projectRouter.get('/:id', projectController.show.bind(projectController)); // Rota para buscar um projeto por ID
projectRouter.put('/:id', authorizeRole(['admin']), projectController.update.bind(projectController));
projectRouter.delete('/:id', authorizeRole(['admin']), projectController.delete.bind(projectController)); // Protegida para admin

// New route for processing images for the results page
projectRouter.post(
  '/process-images-for-results',
  upload.array('images', 50),
  projectController.processImagesForResults.bind(projectController)
);

// New route for saving a single processed image to an inspection
projectRouter.post(
  '/:projectId/inspections/:inspectionId/save-image',
  projectController.saveImageToInspection.bind(projectController)
);

// New route for uploading multiple images to a specific inspection
projectRouter.post(
  '/:projectId/inspections/:inspectionId/upload-images',
  upload.array('images', 50), // Accept up to 50 images in the 'images' field
  projectController.uploadImagesToInspection.bind(projectController)
);

// New route for creating inspections
projectRouter.post(
  '/:projectId/inspections',
  authorizeRole(['admin']), // Protect this route for admin users
  projectController.createInspection.bind(projectController)
);

// New route for deleting inspections
projectRouter.delete(
  '/:projectId/inspections/:inspectionId',
  authorizeRole(['admin']), // Protect this route for admin users
  projectController.deleteInspection.bind(projectController)
);

// New route for deleting image from inspection
projectRouter.delete(
  '/:projectId/inspections/:inspectionId/images/:imageName',
  projectController.deleteImageFromInspection.bind(projectController)
);

// New route for generating PDF inspection report
projectRouter.get(
  '/:projectId/report/pdf/inspections/:inspectionId',
  projectController.generateInspectionPdfReport.bind(projectController)
);

// Define os campos que o multer deve esperar
const uploadFields = [
  { name: 'coverImage', maxCount: 1 },
  { name: 'bimModel', maxCount: 1 },
  { name: 'oaeBimModel[]', maxCount: 30 } // Permite até 30 modelos de OAE
];

projectRouter.post(
  '/',
  authorizeRole(['admin']), // Protegida para admin
  uploadProjects.fields(uploadFields),
  projectController.create.bind(projectController)
);

export default projectRouter;