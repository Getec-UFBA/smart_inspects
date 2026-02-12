import { Request, Response } from 'express';
import UserService from '../services/UserService';

class UserController {
  public async preRegisterUser(req: Request, res: Response): Promise<Response> {
    const { email, role } = req.body;
    const userService = new UserService();

    if (!email || !role) {
      return res.status(400).json({ error: 'Email e role são obrigatórios.' });
    }

    try {
      const newUser = await userService.preRegisterUser({ email, role });
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UserController;
