import UserRepository from '../repositories/UserRepository';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../config/upload';
import { IUser } from '../models/IUser';

interface IRequest {
  userId: string;
  avatarFilename: string;
}

class UpdateAvatarService {
  private userRepository = new UserRepository();

  public async execute({ userId, avatarFilename }: IRequest): Promise<Omit<IUser, 'password' | 'securityAnswer'>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Apenas usuários autenticados podem mudar o avatar.');
    }

    if (user.avatarUrl) {
      const userAvatarFilePath = path.join(uploadConfig.avatarsDirectory, path.basename(user.avatarUrl));
      try {
        await fs.promises.stat(userAvatarFilePath);
        await fs.promises.unlink(userAvatarFilePath);
      } catch {
        // Arquivo não existe, não faz nada
      }
    }

    const avatarUrl = `avatars/${avatarFilename}`;
    user.avatarUrl = avatarUrl;

    await this.userRepository.updateUser(user);

    const { password, securityAnswer, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }
}

export default UpdateAvatarService;
