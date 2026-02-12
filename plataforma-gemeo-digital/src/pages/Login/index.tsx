import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PasswordInput from '../../components/PasswordInput'; // Importa o PasswordInput
import './style.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate('/projetos'); // Redireciona para projetos
    } catch (err) {
      setError('Credenciais inválidas ou cadastro não finalizado.');
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <PasswordInput
            id="password"
            name="password"
            label="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">Entrar</button>
        </form>
        <div className="complete-registration-link">
          <p>Não tem senha? <Link to="/complete-registration">Finalize seu cadastro</Link></p>
          <p><Link to="/forgot-password">Esqueci minha senha</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
