import { Request, Response } from 'express';
import ResetPasswordWithAnswerService from '../services/ResetPasswordWithAnswerService';

class ResetPasswordWithAnswerController {
  public async handle(req: Request, res: Response): Promise<Response> {
    const { email, securityAnswer, newPassword, confirmPassword } = req.body;

    if (!email || !securityAnswer || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'As novas senhas não coincidem.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    }


    const resetService = new ResetPasswordWithAnswerService();

    try {
      await resetService.execute({ email, securityAnswer, newPassword });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default ResetPasswordWithAnswerController;
