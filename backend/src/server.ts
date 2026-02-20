import express from 'express';
import cors from 'cors';
import routes from './routes';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
// Servir arquivos estáticos da pasta 'public'
app.use('/files', express.static(path.resolve(__dirname, '..', 'public', 'uploads')));
app.use(routes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}!`);
});
