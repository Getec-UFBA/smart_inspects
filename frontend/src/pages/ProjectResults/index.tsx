import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Dropdown, Alert } from 'react-bootstrap';
import api from '../../services/api';
import './style.css';

interface IImage {
  url: string;
  detections?: any[];
}

interface IInspection {
  id: string;
  inspectionObjective: string;
}

const ProjectResults: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [images, setImages] = useState<IImage[]>([]);
  const [inspections, setInspections] = useState<IInspection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: { saving: boolean; error: string | null; success: boolean } }>({});

  useEffect(() => {
    if (location.state && location.state.processedImages) {
      setImages(location.state.processedImages);
    } else {
      setError('Nenhuma imagem processada para exibir.');
    }

    const fetchInspections = async () => {
      try {
        const response = await api.get(`/projects/${projectId}`);
        setInspections(response.data.inspections || []);
      } catch (err) {
        console.error('Erro ao buscar inspeções:', err);
        setError('Falha ao carregar as inspeções do projeto.');
      }
    };

    if (projectId) {
      fetchInspections();
    }
  }, [location.state, projectId]);

  const handleSaveToInspection = async (imageUrl: string, detections: any[], inspectionId: string) => {
    if (!projectId || !inspectionId) {
      setSaveStatus(prev => ({
        ...prev,
        [imageUrl]: { saving: false, error: 'ID do Projeto ou da Inspeção inválido.', success: false }
      }));
      return;
    }

    setSaveStatus(prev => ({
      ...prev,
      [imageUrl]: { saving: true, error: null, success: false }
    }));

    try {
      const response = await fetch(`${api.defaults.baseURL}${imageUrl}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        await api.post(`/projects/${projectId}/inspections/${inspectionId}/save-image`, {
          imageData: base64data,
          detections: JSON.stringify(detections),
        });

        setSaveStatus(prev => ({
          ...prev,
          [imageUrl]: { saving: false, error: null, success: true }
        }));
      };
    } catch (err) {
      console.error('Erro ao salvar imagem na inspeção:', err);
      const errorMessage = (err as any).response?.data?.error || 'Erro desconhecido ao salvar imagem.';
      setSaveStatus(prev => ({
        ...prev,
        [imageUrl]: { saving: false, error: errorMessage, success: false }
      }));
    }
  };

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `${api.defaults.baseURL}${imageUrl}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error && images.length === 0) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">{error}</Alert>
        <Button onClick={() => navigate(`/projetos/${projectId}`)}>Voltar ao Projeto</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="project-results-container">
      <Row className="my-4">
        <Col>
          <h1>Imagens Processadas</h1>
          <p>Selecione uma inspeção para salvar as imagens desejadas.</p>
        </Col>
        <Col xs="auto">
          <Button onClick={() => navigate(`/projetos/${projectId}`)}>Voltar ao Projeto</Button>
        </Col>
      </Row>
      <Row>
        {images.map((image, index) => (
          <Col xs={12} sm={6} md={4} lg={3} key={index} className="mb-4">
            <Card>
              <Card.Img variant="top" src={`${api.defaults.baseURL}${image.url}`} alt={`Imagem Processada ${index + 1}`} />
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <Dropdown>
                    <Dropdown.Toggle 
                      variant="primary" 
                      id={`dropdown-save-${index}`}
                      disabled={saveStatus[image.url]?.saving || saveStatus[image.url]?.success}
                    >
                      {saveStatus[image.url]?.saving ? 'Salvando...' : saveStatus[image.url]?.success ? 'Salvo!' : 'Salvar em...'}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      {inspections.length > 0 ? (
                        inspections.map(inspection => (
                          <Dropdown.Item 
                            key={inspection.id}
                            onClick={() => handleSaveToInspection(image.url, image.detections || [], inspection.id)}
                          >
                            {inspection.inspectionObjective}
                          </Dropdown.Item>
                        ))
                      ) : (
                        <Dropdown.Item disabled>Nenhuma inspeção encontrada</Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleDownloadImage(image.url, `processed-image-${index}.png`)}
                  >
                    Download
                  </Button>
                </div>
                {saveStatus[image.url]?.error && (
                  <Alert variant="danger" className="mt-2" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                    {saveStatus[image.url]?.error}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ProjectResults;
