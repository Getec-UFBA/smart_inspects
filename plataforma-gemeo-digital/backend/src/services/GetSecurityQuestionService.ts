import UserRepository from '../repositories/UserRepository';

class GetSecurityQuestionService {
  private userRepository = new UserRepository();

  public async execute(email: string): Promise<{ securityQuestion: string } | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.securityQuestion) {
      // Por segurança, não informamos que o usuário/pergunta não existe.
      // Apenas retornamos nulo, e o controller tratará isso.
      return null;
    }

    return { securityQuestion: user.securityQuestion };
  }
}

export default GetSecurityQuestionService;
