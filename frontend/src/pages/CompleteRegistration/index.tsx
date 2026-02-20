import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../../components/PasswordInput'; // Importa o PasswordInput
import './style.css';

const API_URL = 'http://localhost:3001';

const securityQuestions = [
  "Qual o nome do seu primeiro animal de estimação?",
  "Qual o nome de solteira da sua mãe?",
  "Em que cidade você nasceu?",
  "Qual era o modelo do seu primeiro carro?",
];

const CompleteRegistration: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [question, setQuestion] = useState(securityQuestions[0]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      await axios.post(`${API_URL}/users/complete-registration`, {
        email,
        password,
        confirmPassword,
        securityQuestion: question,
        securityAnswer: answer,
      });
      setSuccess('Cadastro finalizado com sucesso! Você será redirecionado para o login.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Erro ao finalizar o cadastro.');
      } else {
        setError('Erro desconhecido ao finalizar o cadastro.');
      }
      console.error(err);
    }
  };

  return (
    <div className="complete-registration-container">
      <div className="complete-registration-box">
        <h2>Finalizar Cadastro</h2>
        <p>Defina sua senha e uma pergunta de segurança.</p>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <PasswordInput
            id="password"
            name="password"
            label="Nova Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <div className="input-group">
            <label htmlFor="securityQuestion">Pergunta de Segurança</label>
            <select id="securityQuestion" value={question} onChange={e => setQuestion(e.target.value)} required>
              {securityQuestions.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="securityAnswer">Sua Resposta</label>
            <input type="text" id="securityAnswer" value={answer} onChange={e => setAnswer(e.target.value)} required />
          </div>
          <button type="submit" className="complete-registration-button">Finalizar Cadastro</button>
        </form>
        <div className="back-to-login">
          <Link to="/login">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistration;
