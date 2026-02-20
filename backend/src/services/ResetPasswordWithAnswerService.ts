import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/UserRepository';

interface IRequest {
  email: string;
  securityAnswer: string;
  newPassword: string;
}

class ResetPasswordWithAnswerService {
  private userRepository = new UserRepository();

  public async execute({ email, securityAnswer, newPassword }: IRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.securityAnswer) {
      throw new Error('Credenciais inválidas.');
    }

    const isAnswerValid = await bcrypt.compare(securityAnswer, user.securityAnswer);

    if (!isAnswerValid) {
      throw new Error('A resposta de segurança está incorreta.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await this.userRepository.updateUser(user);
  }
}

export default ResetPasswordWithAnswerService;
