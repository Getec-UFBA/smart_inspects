import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import profileRouter from './profile.routes';
import projectRouter from './project.routes'; // Importa as rotas de projeto

const routes = Router();

routes.use('/auth', authRouter);
routes.use('/users', userRouter);
routes.use('/profile', profileRouter);
routes.use('/projects', projectRouter); // Adiciona as rotas de projeto

export default routes;
