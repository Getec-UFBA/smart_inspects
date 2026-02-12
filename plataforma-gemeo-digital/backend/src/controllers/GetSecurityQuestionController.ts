import { Request, Response } from 'express';
import GetSecurityQuestionService from '../services/GetSecurityQuestionService';

class GetSecurityQuestionController {
  public async handle(req: Request, res: Response): Promise<Response> {
    const { email } = req.params; // Pega o email dos parâmetros da rota

    const getSecurityQuestionService = new GetSecurityQuestionService();

    try {
      const result = await getSecurityQuestionService.execute(email);

      if (!result) {
        // Por segurança, retorna um 404 genérico para não confirmar a existência do email
        return res.status(404).json({ error: 'Não foi possível encontrar a pergunta de segurança.' });
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default GetSecurityQuestionController;
