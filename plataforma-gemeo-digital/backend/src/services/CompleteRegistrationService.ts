import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/UserRepository';

interface ICompleteRegistrationRequest {
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

class CompleteRegistrationService {
  private userRepository = new UserRepository();

  public async execute({ email, password, securityQuestion, securityAnswer }: ICompleteRegistrationRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Este email não foi pré-cadastrado por um administrador.');
    }

    if (user.password) {
      throw new Error('Este usuário já completou seu cadastro.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, 10);

    user.password = hashedPassword;
    user.securityQuestion = securityQuestion;
    user.securityAnswer = hashedSecurityAnswer;

    await this.userRepository.updateUser(user);
  }
}

export default CompleteRegistrationService;
