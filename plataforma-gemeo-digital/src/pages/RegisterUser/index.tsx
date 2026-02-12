import React, { useState } from 'react';
import api from '../../services/api';
import './style.css';

const RegisterUser: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // A autenticação do admin já é feita pelo token no header (configurado no AuthContext)
      // e pela proteção da rota no backend
      await api.post('/users/pre-register', { email, role });
      setSuccess(`Usuário ${email} pré-cadastrado com sucesso!`);
      setEmail('');
      setRole('user');
    } catch (err) {
      if (api.isAxiosError(err) && err.response) {
        setError(err.response.data.message || err.response.data.error || 'Erro ao pré-cadastrar usuário.');
      } else {
        setError('Erro desconhecido ao pré-cadastrar usuário.');
      }
      console.error(err);
    }
  };

  return (
    <div className="register-user-container">
      <div className="register-user-box">
        <h2>Pré-cadastrar Usuário</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <div className="input-group">
            <label htmlFor="email">Email do Novo Usuário</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="role">Tipo de Acesso</label>
            <select id="role" name="role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')}>
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" className="register-button">Pré-cadastrar</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
