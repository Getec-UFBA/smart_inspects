import UserRepository from '../repositories/UserRepository';
import { IUser } from '../models/IUser';

interface IRequest {
  userId: string;
  name: string;
  company: string;
  bio: string;
}

class UpdateProfileService {
  private userRepository = new UserRepository();

  public async execute({ userId, name, company, bio }: IRequest): Promise<Omit<IUser, 'password' | 'securityAnswer'>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    user.name = name;
    user.company = company;
    user.bio = bio;

    await this.userRepository.updateUser(user);

    const { password, securityAnswer, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }
}

export default UpdateProfileService;
