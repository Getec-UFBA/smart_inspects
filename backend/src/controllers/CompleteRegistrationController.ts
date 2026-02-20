import { Request, Response } from 'express';
import CompleteRegistrationService from '../services/CompleteRegistrationService';

class CompleteRegistrationController {
  public async handle(req: Request, res: Response): Promise<Response> {
    const { email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem.' });
    }

    if (!email || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    }


    const completeRegistrationService = new CompleteRegistrationService();

    try {
      await completeRegistrationService.execute({ email, password, securityQuestion, securityAnswer });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default CompleteRegistrationController;
