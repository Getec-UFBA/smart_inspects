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

projectRouter.get('/', projectController.index);
projectRouter.get('/:id', projectController.show); // Rota para buscar um projeto por ID
projectRouter.put('/:id', authorizeRole(['admin']), projectController.update);
projectRouter.delete('/:id', authorizeRole(['admin']), projectController.delete); // Protegida para admin

// New route for uploading and processing an image
projectRouter.post(
  '/upload-and-process-image',
  upload.single('image'),
  projectController.uploadAndProcessImage
);

// New route for saving a processed image to the project
projectRouter.post(
  '/:id/save-processed-image',
  projectController.saveProcessedImage
);

// New route for creating inspections
projectRouter.post(
  '/:projectId/inspections',
  authorizeRole(['admin']), // Protect this route for admin users
  projectController.createInspection
);

// New route for deleting inspections
projectRouter.delete(
  '/:projectId/inspections/:inspectionId',
  authorizeRole(['admin']), // Protect this route for admin users
  projectController.deleteInspection
);

// New route for deleting image from inspection
projectRouter.delete(
  '/:projectId/inspections/:inspectionId/images/:imageName',
  projectController.deleteImageFromInspection
);

// New route for generating PDF inspection report
projectRouter.get(
  '/:projectId/report/pdf/inspections/:inspectionId',
  projectController.generateInspectionPdfReport
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
  projectController.create
);

export default projectRouter;