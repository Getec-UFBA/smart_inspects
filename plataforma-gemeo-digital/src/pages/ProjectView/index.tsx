import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Container, Row, Col, Card, Button, Form, Modal, Alert } from 'react-bootstrap';
import './style.css';
import path from 'path-browserify';
import { FaCog, FaPencilAlt } from 'react-icons/fa';

interface IDetection {
  class_name: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

interface IImage {
  url: string;
  detections?: IDetection[];
}

interface IInspection {
  id: string;
  inspectionType: string;
  inspectionObjective: string;
  inspectionDate: string;
  inspectionResponsible: string;
  images: IImage[];
}

interface IProject {
  id: string;
  name: string;
  responsible: string;
  address: string;
  type: string;
  buildingYear?: string;
  builtArea?: string;
  facadeTypology?: string;
  roofTypology?: string;
  buildingAcronym?: string;
  unitDirector?: string;
  coverImageUrl: string;
  bimModelUrl: string;
  modules: {
    progress: boolean;
    security: boolean;
    maintenance: boolean;
  };
  inspections?: IInspection[];
}

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [newInspectionObjective, setNewInspectionObjective] = useState('');
  const [inspectionType, setInspectionType] = useState('Preventiva');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionResponsible, setInspectionResponsible] = useState('');
  const [showCreateInspectionModal, setShowCreateInspectionModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [selectedInspectionImages, setSelectedInspectionImages] = useState<IImage[]>([]);
  const [selectedInspectionObjective, setSelectedInspectionObjective] = useState<string>('');
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<IProject>>({});
  const [showEditInspectionModal, setShowEditInspectionModal] = useState(false);
  const [editingInspection, setEditingInspection] = useState<IInspection | null>(null);

  const handleInspectionClick = (inspection: IInspection) => {
    setSelectedInspectionImages(inspection.images);
    setSelectedInspectionObjective(inspection.inspectionObjective);
    setSelectedInspectionId(inspection.id);
    setShowImageModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;

    try {
      const response = await api.put(`/projects/${project.id}`, editFormData);
      setProject(response.data);
      fetchProject();
      setShowEditModal(false);
      alert('Projeto atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar o projeto:', err);
      const errorMessage = (err as any).response?.data?.error || 'Erro desconhecido';
      setError(`Erro ao atualizar o projeto: ${errorMessage}`);
    }
  };

  const openEditModal = () => {
    if (project) {
      setEditFormData({
        name: project.name,
        address: project.address,
        type: project.type,
        responsible: project.responsible,
        buildingYear: project.buildingYear,
        builtArea: project.builtArea,
        facadeTypology: project.facadeTypology,
        roofTypology: project.roofTypology,
        buildingAcronym: project.buildingAcronym,
        unitDirector: project.unitDirector,
      });
    }
    setShowEditModal(true);
  };

  const openEditInspectionModal = (inspection: IInspection) => {
    setEditingInspection(inspection);
    setShowEditInspectionModal(true);
  };

  const handleUpdateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editingInspection) return;

    const updatedInspections = project.inspections?.map(insp =>
      insp.id === editingInspection.id ? editingInspection : insp
    );

    try {
      await api.put(`/projects/${project.id}`, { inspections: updatedInspections });
      setShowEditInspectionModal(false);
      setEditingInspection(null);
      fetchProject();
      alert('Inspeção atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar a inspeção:', err);
      setError('Erro ao atualizar a inspeção.');
    }
  };

  const handleCreateInspection = async () => {
    if (!project?.id || !newInspectionObjective.trim()) {
      setError('ID do projeto e objetivo da inspeção são obrigatórios.');
      return;
    }
    if (!inspectionDate) {
      setError('Data da inspeção é obrigatória.');
      return;
    }
    if (!inspectionResponsible.trim()) {
      setError('Responsável pela inspeção é obrigatório.');
      return;
    }

    try {
      await api.post(`/projects/${project.id}/inspections`, {
        inspectionType,
        inspectionObjective: newInspectionObjective,
        inspectionDate,
        inspectionResponsible,
      });
      alert(`Inspeção "${newInspectionObjective}" criada com sucesso!`);
      setNewInspectionObjective('');
      setInspectionType('Preventiva');
      setInspectionDate('');
      setInspectionResponsible('');
      setShowCreateInspectionModal(false);
      fetchProject();
    } catch (err) {
      console.error('Erro ao criar inspeção:', err);
      const errorMessage = (err as any).response?.data?.error || 'Erro desconhecido';
      setError(`Erro ao criar inspeção: ${errorMessage}`);
      alert(`Erro ao criar inspeção: ${errorMessage}`);
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!project?.id) {
      setError('ID do projeto ausente.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta inspeção e todas as suas imagens?')) {
      try {
        await api.delete(`/projects/${project.id}/inspections/${inspectionId}`);
        alert('Inspeção excluída com sucesso!');
        fetchProject();
        if (showImageModal && selectedInspectionId === inspectionId) {
          setShowImageModal(false);
          setSelectedInspectionImages([]);
          setSelectedInspectionObjective('');
        }
      } catch (err) {
        console.error('Erro ao excluir inspeção:', err);
        setError('Erro ao excluir inspeção.');
      }
    }
  };

  const handleDeleteImageFromInspection = async (imageUrl: string, inspectionId: string) => {
    if (!project?.id) {
      setError('ID do projeto ausente.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta imagem desta inspeção?')) {
      try {
        const imageName = path.basename(imageUrl);
        await api.delete(`/projects/${project.id}/inspections/${inspectionId}/images/${imageName}`);
        alert('Imagem excluída com sucesso da inspeção!');
        fetchProject();
        if (showImageModal && selectedInspectionId === inspectionId) {
          setSelectedInspectionImages(prevImages => prevImages.filter(img => img.url !== imageUrl));
        }
      } catch (err) {
        console.error('Erro ao excluir imagem da inspeção:', err);
        setError('Erro ao excluir imagem da inspeção.');
      }
    }
  };

  const handleProcessImages = async () => {
    if (selectedFiles.length === 0 || !project) return;

    setProcessing(true);
    setError(null);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/projects/process-images', formData);
      setSelectedFiles([]);
      alert('Imagens enviadas para revisão!');
      navigate(`/review/${response.data.reviewId}`);
    } catch (err) {
      console.error('Erro ao processar imagens:', err);
      const errorMessage = (err as any).response?.data?.error || 'Erro desconhecido ao processar imagens.';
      setError(errorMessage);
      alert(`Ocorreu um erro ao enviar as imagens: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const fetchProject = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err) {
      setError('Erro ao carregar o projeto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [fetchProject, id]);

  const handleGenerateInspectionPdfReport = async (projectId: string, inspectionId: string) => {
    if (!projectId || !inspectionId) {
      setError('ID do projeto ou ID da inspeção ausente. Não é possível gerar o relatório.');
      return;
    }

    setIsGeneratingReport(true);
    setError(null);

    try {
      const response = await api.get(`/projects/${projectId}/report/pdf/inspections/${inspectionId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-inspecao-${inspectionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`Relatório PDF da inspeção "${inspectionId}" gerado com sucesso!`);
    } catch (err) {
      console.error(`Erro ao gerar relatório PDF da inspeção "${inspectionId}":`, err);
      setError(`Erro ao gerar relatório PDF da inspeção "${inspectionId}".`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGeneratePdfReport = async () => {
    if (!project?.id) {
      setError('ID do projeto ausente. Não é possível gerar o relatório.');
      return;
    }

    setIsGeneratingReport(true);
    setError(null);

    try {
      const response = await api.get(`/projects/${project.id}/report/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-projeto-${project.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Relatório PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
      setError('Erro ao gerar relatório PDF.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      setLastBatchId(null);
    }
  };

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
    <Container fluid className="project-view-container">
      <Row className="align-items-center my-4 project-header">
        <Col>
          <h1 className="project-title">
            {project.name}
            <Button variant="link" onClick={openEditModal} className="ms-2">
              <FaCog />
            </Button>
          </h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => navigate(`/projetos/${id}/dashboard`)} className="me-2">
            Dashboard
          </Button>
          <Button
            variant="info"
            onClick={handleGeneratePdfReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório Geral'}
          </Button>
        </Col>
      </Row>
      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Processamento de Imagens</Card.Title>
              <div className="image-input-group">
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>
                    Selecionar Imagens ou Pasta ({selectedFiles.length} {selectedFiles.length === 1 ? 'arquivo' : 'arquivos'} selecionados)
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    onChange={handleFileChange} 
                    multiple 
                    directory="" 
                    webkitdirectory="" 
                  />
                </Form.Group>
                <Button
                  variant="success"
                  onClick={handleProcessImages}
                  disabled={selectedFiles.length === 0 || processing}
                  style={{ marginLeft: '1rem' }}
                >
                  {processing ? 'Processando...' : 'Processar Imagens'}
                </Button>
              </div>

              {lastBatchId && (
                <div className="mt-3">
                  <Alert variant="success">
                    Imagens enviadas para processamento!
                  </Alert>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/projetos/${project.id}/results/${lastBatchId}`)}
                  >
                    Ver Imagens Processadas
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
          <Card className="mt-4">
            <Card.Body>
              <Card.Title className="d-flex justify-content-between align-items-center">
                Inspeções e Imagens Salvas
                <Button variant="success" size="sm" onClick={() => setShowCreateInspectionModal(true)}>
                  Criar Nova Inspeção
                </Button>
              </Card.Title>

              {project.inspections && project.inspections.length > 0 ? (
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                  {project.inspections.map((inspection) => (
                    <Col key={inspection.id}>
                      <Card
                        className="text-center folder-card"
                        onClick={() => handleInspectionClick(inspection)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
                          <Card.Title>{inspection.inspectionObjective}</Card.Title>
                          <Card.Text>
                            Tipo: {inspection.inspectionType} <br />
                            Data: {inspection.inspectionDate} <br />
                            Responsável: {inspection.inspectionResponsible} <br />
                            {inspection.images.length} imagens
                          </Card.Text>
                        </Card.Body>
                        <Card.Footer>
                          <Button
                            variant="light"
                            size="sm"
                            className="me-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditInspectionModal(inspection);
                            }}
                          >
                            <FaPencilAlt />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInspection(inspection.id);
                            }}
                          >
                            Excluir Inspeção
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <p>Nenhuma inspeção ou imagem salva ainda para este projeto.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="modules-card">
            <Card.Header>Módulos</Card.Header>
            <Card.Body>
              {project.modules.progress && <p>Acompanhamento de Progresso</p>}
              {project.modules.security && <p>Segurança do Trabalho</p>}
              {project.modules.maintenance && <p>Manutenção Preditiva</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showCreateInspectionModal} onHide={() => setShowCreateInspectionModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Criar Nova Inspeção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleCreateInspection(); }}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Inspeção</Form.Label>
              <Form.Select value={inspectionType} onChange={e => setInspectionType(e.target.value)}>
                <option value="Preventiva">Preventiva</option>
                <option value="Corretiva">Corretiva</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Objetivo da Inspeção</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Verificação de rachaduras na fachada principal"
                value={newInspectionObjective}
                onChange={e => setNewInspectionObjective(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Data da Inspeção</Form.Label>
              <Form.Control
                type="date"
                value={inspectionDate}
                onChange={e => setInspectionDate(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Responsável pela Inspeção</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: João da Silva (Engenheiro Civil)"
                value={inspectionResponsible}
                onChange={e => setInspectionResponsible(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={!newInspectionObjective.trim() || !inspectionDate || !inspectionResponsible.trim()}>
              Criar Inspeção
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" className="image-modal">
        <Modal.Header closeButton>
          <Modal.Title>Imagens em "{selectedInspectionObjective}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInspectionImages.length > 0 ? (
            <Row>
              {selectedInspectionImages.map((image, index) => (
                <Col xs={6} md={4} lg={3} key={index} className="mb-3">
                  <Card>
                    {(() => {
                      const imageUrlForDisplay = image.url ? `http://localhost:3001${image.url}` : '';
                      return imageUrlForDisplay ? (
                        <Card.Img variant="top" src={imageUrlForDisplay} alt={`Imagem ${index}`} />
                      ) : (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                          Imagem não disponível
                        </div>
                      );
                    })()}
                    <Card.Body className="p-2">
                      <Card.Text className="text-muted small text-truncate mb-2">
                        {image.url ? path.basename(image.url) : 'Nome da imagem indisponível'}
                      </Card.Text>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          if (image.url && selectedInspectionId) {
                            handleDeleteImageFromInspection(image.url, selectedInspectionId);
                          }
                        }}
                        disabled={!image.url}
                      >
                        Excluir
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p>Nenhuma imagem nesta inspeção.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isGeneratingReport && <p className="text-center w-100">Gerando relatório...</p>}
          <Button
            variant="primary"
            onClick={() => project && selectedInspectionId && handleGenerateInspectionPdfReport(project.id, selectedInspectionId)}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório da Inspeção'}
          </Button>
          <Button variant="secondary" onClick={() => setShowImageModal(false)} disabled={isGeneratingReport}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Projeto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateProject}>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Projeto</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.name || ''}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.address || ''}
                onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.type || ''}
                onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Responsável</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.responsible || ''}
                onChange={e => setEditFormData({ ...editFormData, responsible: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Salvar Alterações
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal para Editar Inspeção */}
      <Modal show={showEditInspectionModal} onHide={() => setShowEditInspectionModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Inspeção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingInspection && (
            <Form onSubmit={handleUpdateInspection}>
              <Form.Group className="mb-3">
                <Form.Label>Objetivo da Inspeção</Form.Label>
                <Form.Control
                  type="text"
                  value={editingInspection.inspectionObjective}
                  onChange={e => setEditingInspection({ ...editingInspection, inspectionObjective: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  type="text"
                  value={editingInspection.inspectionType}
                  onChange={e => setEditingInspection({ ...editingInspection, inspectionType: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Data</Form.Label>
                <Form.Control
                  type="date"
                  value={editingInspection.inspectionDate}
                  onChange={e => setEditingInspection({ ...editingInspection, inspectionDate: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Responsável</Form.Label>
                <Form.Control
                  type="text"
                  value={editingInspection.inspectionResponsible}
                  onChange={e => setEditingInspection({ ...editingInspection, inspectionResponsible: e.target.value })}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Salvar Alterações
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default ProjectView;