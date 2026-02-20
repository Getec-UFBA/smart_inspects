import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/UserRepository';

interface IRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

class ChangePasswordService {
  private userRepository = new UserRepository();

  public async execute({ userId, oldPassword, newPassword }: IRequest): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (!user.password) {
      throw new Error('Usuário não possui uma senha cadastrada (cadastro não finalizado).');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new Error('A senha atual está incorreta.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await this.userRepository.updateUser(user);
  }
}

export default ChangePasswordService;
