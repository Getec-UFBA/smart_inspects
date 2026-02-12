import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap'; // Removed Dropdown, ButtonGroup
import './style.css';
import path from 'path-browserify';
import { ThemeContext } from '../../contexts/ThemeContext';

interface IDetection {
  class_name: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

interface IImage {
  url: string;
  detections?: IDetection[];
}

// Nova interface IInspection (substitui IFolder)
interface IInspection {
  id: string; // Adicionar ID para a inspeção
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
  coverImageUrl: string;
  bimModelUrl: string;
  modules: {
    progress: boolean;
    security: boolean;
    maintenance: boolean;
  };
  inspections?: IInspection[]; // Substitui 'folders'
}

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedImageResponse, setProcessedImageResponse] = useState<{ base64: string; detections: IDetection[] } | null>(null); // New state
  const [savingImage, setSavingImage] = useState(false);
  const [newInspectionObjective, setNewInspectionObjective] = useState(''); // Renomeado de newFolderName
  const [inspectionType, setInspectionType] = useState('Preventiva'); // Novo estado para Tipo de Inspeção
  const [inspectionDate, setInspectionDate] = useState(''); // Novo estado para Data da Inspeção
  const [inspectionResponsible, setInspectionResponsible] = useState(''); // Novo estado para Responsável pela Inspeção
  const [selectedInspectionToSave, setSelectedInspectionToSave] = useState<string>(''); // Renomeado de selectedFolderToSave
  const [showCreateInspectionModal, setShowCreateInspectionModal] = useState(false); // Novo estado para modal de inspeção
  const [showCreateFolderInput, setShowCreateFolderInput] = useState<boolean>(false); // State to toggle new folder input (manter por enquanto)
  const [showImageModal, setShowImageModal] = useState<boolean>(false); // State to control modal visibility
  const [selectedInspectionImages, setSelectedInspectionImages] = useState<IImage[]>([]); // State to hold images of the selected folder (now IImage[])
  const [selectedInspectionObjective, setSelectedInspectionObjective] = useState<string>(''); // State to hold the name of the selected folder
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false); // New state for loading indicator

  const handleInspectionClick = (inspection: IInspection) => {
    setSelectedInspectionImages(inspection.images);
    setSelectedInspectionObjective(inspection.inspectionObjective); // Usar o objetivo como nome para o modal
    setShowImageModal(true);
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
      // Resetar estados do formulário de inspeção
      setNewInspectionObjective('');
      setInspectionType('Preventiva');
      setInspectionDate('');
      setInspectionResponsible('');
      setShowCreateInspectionModal(false); // Fechar o modal
      fetchProject(); // Atualizar a lista de inspeções
    } catch (err) {
      console.error('Erro ao criar inspeção:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erro desconhecido ao criar inspeção.';
      setError(`Erro ao criar inspeção: ${errorMessage}`);
      alert(`Erro ao criar inspeção: ${errorMessage}`); // Adicionar alerta para depuração
    }
  };

  const handleDeleteInspection = async (inspectionId: string) => {
    if (!project?.id) {
      setError('ID do projeto ausente.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir esta inspeção e todas as suas imagens?`)) {
      try {
        await api.delete(`/projects/${project.id}/inspections/${inspectionId}`);
        alert(`Inspeção excluída com sucesso!`);
        fetchProject();
        // Close modal if the deleted inspection was the one being viewed
        if (showImageModal && selectedInspectionToSave === inspectionId) { // Assumindo que selectedInspectionToSave guarda o ID
          setShowImageModal(false);
          setSelectedInspectionImages([]);
          setSelectedInspectionObjective(''); // Manter vazio ou limpar
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

    if (window.confirm(`Tem certeza que deseja excluir esta imagem desta inspeção?`)) {
      try {
        const imageName = path.basename(imageUrl);
        await api.delete(`/projects/${project.id}/inspections/${inspectionId}/images/${imageName}`);
        alert('Imagem excluída com sucesso da inspeção!');
        fetchProject();
        // Update the modal's image list if it's open and showing images from this inspection
        if (showImageModal && selectedInspectionToSave === inspectionId) {
          setSelectedInspectionImages(prevImages => prevImages.filter(img => img.url !== imageUrl));
        }
      } catch (err) {
        console.error('Erro ao excluir imagem da inspeção:', err);
        setError('Erro ao excluir imagem da inspeção.');
      }
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await api.post('/projects/upload-and-process-image', formData); // Expect JSON response
      setProcessedImageResponse({ // Update state to store both base64 and detections
        base64: `data:image/png;base64,${response.data.processed_image_base64}`,
        detections: response.data.detections,
      });
      // setProcessedImageUrl(`data:image/png;base64,${response.data.processed_image_base64}`); // This state is now redundant for actual image data
    } catch (err) {
      console.error('Erro ao processar a imagem:', err);
      setError('Erro ao processar a imagem.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveProcessedImage = async () => {
    if (!processedImageResponse || !project?.id || !selectedInspectionToSave) {
      setError('Nenhuma imagem processada para salvar, ID do projeto ausente ou inspeção não selecionada.');
      return;
    }

    setSavingImage(true);
    setError(null);

    try {
      const requestBody = {
        imageData: processedImageResponse.base64,
        projectId: project.id,
        inspectionId: selectedInspectionToSave, // Usar o novo nome do campo
        detections: JSON.stringify(processedImageResponse.detections),
      };

      await api.post(`/projects/${project.id}/save-processed-image`, requestBody);

      alert('Imagem salva com sucesso na inspeção!');
      setProcessedImageResponse(null); // Clear processed image and detections
      setSelectedInspectionToSave(''); // Clear selected inspection
      fetchProject(); // Re-fetch project data to update saved images list
    } catch (err) {
      console.error('Erro ao salvar imagem na inspeção:', err);
      setError('Erro ao salvar imagem na inspeção.');
    } finally {
      setSavingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (processedImageResponse?.base64) { // Updated to use processedImageResponse
      const link = document.createElement('a');
      link.href = processedImageResponse.base64;
      link.download = `processed_image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    if (id) { // Only fetch project if ID is available
      fetchProject();
    }
  }, [fetchProject, id]); // Add 'id' to dependency array

  console.log("Project state:", project);
  console.log("Error state:", error);
  console.log("Loading state:", loading);

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
      // Make API call to backend endpoint for PDF generation
      const response = await api.get(`/projects/${project.id}/report/pdf`, {
        responseType: 'blob', // Important: specify responseType as 'blob'
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-projeto-${project.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up the URL

      alert('Relatório PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
      setError('Erro ao gerar relatório PDF.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
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
          <h1 className="project-title">{project.name}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => navigate(`/projetos/${id}/dashboard`)} className="me-2">
            Dashboard
          </Button>
          <Button
            variant="info" // Cor para distinguir
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
              <Card.Title>Processamento de Imagem</Card.Title>
              <div className="image-input-group">
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Selecionar Imagem</Form.Label>
                  <Form.Control type="file" onChange={handleFileChange} />
                </Form.Group>
                <Button
                  variant="success"
                  onClick={handleProcessImage}
                  disabled={!selectedFile || processing}
                  style={{ marginLeft: '1rem' }}
                >
                  {processing ? 'Processando...' : 'Processar'}
                </Button>
              </div>

              {processedImageResponse && ( // Use processedImageResponse for display
                <div className="image-preview-container">
                  <h5>Imagem Processada:</h5>
                  <img src={processedImageResponse.base64} alt="Processed" />
                  <Form.Group controlId="inspectionSelect" className="mt-3">
                    <Form.Label>Salvar em Inspeção:</Form.Label>
                    <Form.Select
                      value={selectedInspectionToSave}
                      onChange={(e) => setSelectedInspectionToSave(e.target.value)}
                      disabled={!processedImageResponse.base64 || (project.inspections?.length || 0) === 0}
                    >
                      <option value="">Selecione uma inspeção</option>
                      {project.inspections?.map((inspection) => (
                        <option key={inspection.id} value={inspection.id}>
                          {inspection.inspectionObjective} ({inspection.inspectionDate})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button
                    variant="success"
                    onClick={handleSaveProcessedImage}
                    disabled={savingImage || !selectedInspectionToSave}
                    className="mt-3 me-2" // Added me-2 for margin-right
                  >
                    {savingImage ? 'Salvando...' : 'Salvar no Projeto'}
                  </Button>
                  <Button
                    variant="info"
                    onClick={handleDownloadImage}
                    className="mt-3"
                  >
                    Baixar Imagem
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
                  {project.inspections.map((inspection, inspectionIndex) => (
                    <Col key={inspection.id}>
                      <Card
                        className="text-center folder-card" // Mantendo folder-card para estilo, mas representa inspeção
                        onClick={() => handleInspectionClick(inspection)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div> {/* Ícone de inspeção */}
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
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Previne que o card seja clicado quando o botão é clicado
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

      {/* Modal para Criar Nova Inspeção */}
      <Modal show={showCreateInspectionModal} onHide={() => setShowCreateInspectionModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Criar Nova Inspeção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateInspection}>
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

      {/* Modal para exibir imagens da pasta selecionada */}
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
                      console.log(`Attempting to load image ${index}: ${imageUrlForDisplay}`);
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
                          image.url && handleDeleteImageFromInspection(image.url, selectedInspectionObjective);
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
            onClick={() => project && handleGenerateInspectionPdfReport(project.id, selectedInspectionObjective)}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Gerando Relatório...' : 'Gerar Relatório da Inspeção'}
          </Button>
          <Button variant="secondary" onClick={() => setShowImageModal(false)} disabled={isGeneratingReport}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProjectView;