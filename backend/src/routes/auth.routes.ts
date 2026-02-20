import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import GetSecurityQuestionController from '../controllers/GetSecurityQuestionController';
import ResetPasswordWithAnswerController from '../controllers/ResetPasswordWithAnswerController';

const authRouter = Router();
const authController = new AuthController();
const getSecurityQuestionController = new GetSecurityQuestionController();
const resetPasswordWithAnswerController = new ResetPasswordWithAnswerController();

authRouter.post('/login', authController.login);
authRouter.get('/security-question/:email', getSecurityQuestionController.handle);
authRouter.post('/reset-password-with-answer', resetPasswordWithAnswerController.handle);


export default authRouter;
