import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');
const reviewsTempFolder = path.resolve(__dirname, '..', '..', 'tmp', 'reviews'); // New directory for pending reviews
const projectsUploadFolder = path.resolve(__dirname, '../../public/uploads/projects');
const avatarsUploadFolder = path.resolve(__dirname, '../../public/uploads/avatars');

if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}
if (!fs.existsSync(reviewsTempFolder)) { // Ensure reviews temp folder is created
  fs.mkdirSync(reviewsTempFolder, { recursive: true });
}

export default {
  tempDirectory: tmpFolder,
  reviewsDirectory: reviewsTempFolder, // Add new directory to config
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
