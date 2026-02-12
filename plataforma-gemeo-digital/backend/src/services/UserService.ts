import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../models/IUser';

interface IPreRegisterUserRequest {
  email: string;
  role: 'admin' | 'user';
}

class UserService {
  private userRepository = new UserRepository();

  public async preRegisterUser({ email, role }: IPreRegisterUserRequest): Promise<Omit<IUser, 'password'>> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('Usuário com este email já existe.');
    }

    const newUser: IUser = {
      id: uuidv4(),
      email,
      role,
    };

    const createdUser = await this.userRepository.saveUser(newUser);
    const { password: _, ...userWithoutPassword } = createdUser;
    return userWithoutPassword;
  }
}

export default UserService;
