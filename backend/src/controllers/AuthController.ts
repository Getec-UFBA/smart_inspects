import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  public async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;
    const authService = new AuthService();

    try {
      const { token, user } = await authService.login({ email, password });
      return res.json({ token, user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
