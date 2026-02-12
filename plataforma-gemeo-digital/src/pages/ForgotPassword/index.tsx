import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PasswordInput from '../../components/PasswordInput'; // Importa o PasswordInput
import './style.css';

const API_URL = 'http://localhost:3001';

type Stage = 'enter_email' | 'answer_question' | 'success';

const ForgotPassword = () => {
  const [stage, setStage] = useState<Stage>('enter_email');
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/auth/security-question/${email}`);
      setSecurityQuestion(response.data.securityQuestion);
      setStage('answer_question');
    } catch (err) {
      setError('Email não encontrado ou sem pergunta de segurança configurada.');
      console.error(err);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/reset-password-with-answer`, {
        email,
        securityAnswer,
        newPassword,
        confirmPassword,
      });
      setStage('success');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Erro ao redefinir a senha.');
      } else {
        setError('Erro desconhecido ao redefinir a senha.');
      }
      console.error(err);
    }
  };

  const renderStage = () => {
    switch (stage) {
      case 'enter_email':
        return (
          <form onSubmit={handleEmailSubmit}>
            <h2>Esqueci Minha Senha</h2>
            <p>Informe seu email para continuar.</p>
            {error && <p className="error-message">{error}</p>}
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="forgot-password-button">Continuar</button>
          </form>
        );
      case 'answer_question':
        return (
          <form onSubmit={handleResetSubmit}>
            <h2>Pergunta de Segurança</h2>
            <p className="security-question-text">{securityQuestion}</p>
            {error && <p className="error-message">{error}</p>}
            <div className="input-group">
              <label htmlFor="securityAnswer">Sua Resposta</label>
              <input type="text" id="securityAnswer" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} required />
            </div>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              label="Nova Senha"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
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
            <button type="submit" className="forgot-password-button">Redefinir Senha</button>
          </form>
        );
      case 'success':
        return (
          <div className="success-container">
            <h2>Senha Redefinida!</h2>
            <p>Sua senha foi alterada com sucesso.</p>
            <Link to="/login" className="forgot-password-button">Ir para o Login</Link>
          </div>
        );
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        {renderStage()}
        {stage !== 'success' && (
          <div className="back-to-login">
            <Link to="/login">Voltar para o Login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
