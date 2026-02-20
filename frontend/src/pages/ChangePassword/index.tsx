import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import PasswordInput from '../../components/PasswordInput';
import './style.css';

const API_URL = 'http://localhost:3001';

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    try {
      await axios.patch(`${API_URL}/profile/password`, {
        oldPassword,
        newPassword,
        confirmNewPassword,
      });
      setSuccess('Senha alterada com sucesso!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Erro ao alterar a senha.');
      } else {
        setError('Erro desconhecido ao alterar a senha.');
      }
    }
  };

  return (
    <Container className="change-password-container">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <div className="change-password-box">
            <h2 className="text-center mb-4">Alterar Senha</h2>
            <Form onSubmit={handleSubmit}>
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <PasswordInput
                id="oldPassword"
                name="oldPassword"
                label="Senha Atual"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <PasswordInput
                id="newPassword"
                name="newPassword"
                label="Nova Senha"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <PasswordInput
                id="confirmNewPassword"
                name="confirmNewPassword"
                label="Confirmar Nova Senha"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                required
              />

              <Button variant="primary" type="submit" className="w-100 mt-3">
                Salvar Nova Senha
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ChangePassword;
