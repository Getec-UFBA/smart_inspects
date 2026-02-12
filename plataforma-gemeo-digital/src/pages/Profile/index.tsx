import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Image } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './style.css';

const API_URL = 'http://localhost:3001';

const Profile: React.FC = () => {
  const { user, token, updateUser } = useAuth(); // Pega a função updateUser
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Inicializa o formulário com os dados do contexto, se existirem
    if (user) {
      setName(user.name || '');
      setCompany(user.company || '');
      setBio(user.bio || '');
      if (user.avatarUrl) {
        // Assume que o avatarUrl no contexto já é o caminho relativo
        setAvatarUrl(`${API_URL}/files/${user.avatarUrl}`);
      }
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const data = new FormData();
      data.append('avatar', e.target.files[0]);

      try {
        const response = await axios.patch(`${API_URL}/profile/avatar`, data);
        const updatedUser = response.data;

        if (updatedUser.avatarUrl) {
          setAvatarUrl(`${API_URL}/files/${updatedUser.avatarUrl}`);
        }
        // Atualiza o usuário no contexto global
        updateUser(updatedUser);
        setSuccess('Avatar atualizado com sucesso!');
      } catch (err) {
        setError('Erro ao atualizar o avatar.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.put(`${API_URL}/profile/me`, { name, company, bio });
      // Atualiza o usuário no contexto global
      updateUser(response.data);
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar o perfil.');
    }
  };

  return (
    <Container className="profile-container">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <div className="profile-box">
            <h2 className="text-center mb-4">Meu Perfil</h2>

            <div className="avatar-section text-center mb-4">
              <Image src={avatarUrl || 'https://via.placeholder.com/150'} roundedCircle className="avatar-image" />
              <Form.Group controlId="formFile" className="mt-3">
                <Form.Label className="avatar-label">Mudar Foto de Perfil</Form.Label>
                <Form.Control type="file" onChange={handleAvatarChange} />
              </Form.Group>
            </div>

            <Form onSubmit={handleSubmit}>
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <Form.Group as={Row} className="mb-3" controlId="formName">
                <Form.Label column sm={2}>Nome</Form.Label>
                <Col sm={10}>
                  <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3" controlId="formCompany">
                <Form.Label column sm={2}>Empresa</Form.Label>
                <Col sm={10}>
                  <Form.Control type="text" value={company} onChange={e => setCompany(e.target.value)} />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3" controlId="formBio">
                <Form.Label column sm={2}>Bio</Form.Label>
                <Col sm={10}>
                  <Form.Control as="textarea" rows={3} value={bio} onChange={e => setBio(e.target.value)} />
                </Col>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mt-3">Salvar Alterações</Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
