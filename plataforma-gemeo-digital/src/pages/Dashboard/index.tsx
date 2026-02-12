import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card } from 'react-bootstrap';
// import './style.css';

const API_URL = 'http://localhost:3001';

interface IProject {
  id: string;
  name: string;
  responsible: string;
  address: string;
  type: string;
  modules: {
    progress: boolean;
    security: boolean;
    maintenance: boolean;
  };
}

const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        setError('Erro ao carregar os dados do projeto.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!project) {
    return <p>Projeto não encontrado.</p>;
  }

  return (
    <Container fluid>
      <h1 className="my-4">Dashboard: {project.name}</h1>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Informações Gerais</Card.Title>
              <p><strong>Responsável:</strong> {project.responsible}</p>
              <p><strong>Endereço:</strong> {project.address}</p>
              <p><strong>Tipo de obra:</strong> {project.type}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Módulos Ativos</Card.Header>
            <Card.Body>
              {project.modules.progress && <p>Acompanhamento de Progresso</p>}
              {project.modules.security && <p>Segurança do Trabalho</p>}
              {project.modules.maintenance && <p>Manutenção Preditiva</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
