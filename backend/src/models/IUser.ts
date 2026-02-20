export interface IUser {
  id: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  securityQuestion?: string;
  securityAnswer?: string; // Será armazenado com hash
  name?: string;
  company?: string;
  bio?: string;
  avatarUrl?: string;
}
