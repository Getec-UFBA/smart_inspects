import { Router } from 'express';
import UserController from '../controllers/UserController';
import CompleteRegistrationController from '../controllers/CompleteRegistrationController';
import { authenticateToken, authorizeRole } from '../middlewares/auth';

const userRouter = Router();
const userController = new UserController();
const completeRegistrationController = new CompleteRegistrationController();

// Rota para o admin pré-cadastrar um usuário (email + role)
userRouter.post('/pre-register', authenticateToken, authorizeRole(['admin']), userController.preRegisterUser);

// Rota pública para um usuário finalizar seu cadastro definindo uma senha
userRouter.post('/complete-registration', completeRegistrationController.handle);

export default userRouter;
