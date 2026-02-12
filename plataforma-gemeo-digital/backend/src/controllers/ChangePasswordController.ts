import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth'; // Importa a interface
import ChangePasswordService from '../services/ChangePasswordService';

class ChangePasswordController {
  public async handle(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.userId;
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário não encontrado no token.' });
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'A nova senha e a confirmação não coincidem.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    }


    const changePasswordService = new ChangePasswordService();

    try {
      await changePasswordService.execute({ userId, oldPassword, newPassword });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default ChangePasswordController;
