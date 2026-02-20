import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../models/IUser';

interface IAuthRequest {
  email: string;
  password: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1d';

class AuthService {
  private userRepository = new UserRepository();

  public async login({ email, password }: IAuthRequest): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    const user = await this.userRepository.findByEmail(email);

    // Garante que o usuário existe e tem uma senha cadastrada
    if (!user || !user.password) {
      throw new Error('Credenciais inválidas ou cadastro não finalizado.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas ou cadastro não finalizado.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const { password: _, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
  }
}

export default AuthService;
