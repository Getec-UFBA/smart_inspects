import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const projectsUploadFolder = path.resolve(__dirname, '../../public/uploads/projects');
const avatarsUploadFolder = path.resolve(__dirname, '../../public/uploads/avatars');

export default {
  projectsDirectory: projectsUploadFolder,
  avatarsDirectory: avatarsUploadFolder,
  storage: (directory: string) => multer.diskStorage({
    destination: directory,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');
      // Garante que o nome do arquivo seja único e seguro
      const fileName = `${fileHash}-${file.originalname.replace(/\s/g, '_')}`;
      return callback(null, fileName);
    },
  }),
};
