import { Router } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload';
import ProfileController from '../controllers/ProfileController';
import ChangePasswordController from '../controllers/ChangePasswordController';
import { authenticateToken } from '../middlewares/auth';

const profileRouter = Router();
const uploadAvatar = multer({ storage: uploadConfig.storage(uploadConfig.avatarsDirectory) });
const profileController = new ProfileController();
const changePasswordController = new ChangePasswordController();

// Todas as rotas de perfil precisam de autenticação
profileRouter.use(authenticateToken);

profileRouter.get('/me', profileController.show);
profileRouter.put('/me', profileController.update);
profileRouter.patch('/password', changePasswordController.handle);
profileRouter.patch(
  '/avatar',
  uploadAvatar.single('avatar'),
  profileController.updateAvatar,
);

export default profileRouter;
