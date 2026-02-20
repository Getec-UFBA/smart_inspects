import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './style.css';

// --- New Authenticated Image Component ---
const AuthenticatedImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await api.get(src, { responseType: 'blob' });
        const objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      } catch (error) {
        console.error('Failed to fetch image:', error);
        // You could set a placeholder error image URL here
      }
    };

    if (src) {
      fetchImage();
    }

    // Cleanup function to revoke the object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [src]);

  return imageUrl ? <img src={imageUrl} alt={alt} /> : <p>Carregando imagem...</p>;
};

// --- Updated Interfaces ---
interface IDetection {
  class_name: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

interface IPendingReviewImage {
  imageId: string;
  originalFileName: string;
  detections: IDetection[];
}

interface IReviewData {
  id: string;
  images: IPendingReviewImage[];
}

interface IProject {
  id: string;
  name: string;
  inspections: IInspection[];
}

interface IInspection {
  id: string;
  inspectionObjective: string;
}

const ReviewImages: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [reviewData, setReviewData] = useState<IReviewData | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedInspection, setSelectedInspection] = useState<string>('');
  
  const [modalImage, setModalImage] = useState<IPendingReviewImage | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      if (!reviewId) return;
      try {
        const response = await api.get(`/projects/review/${reviewId}`);
        setReviewData(response.data);
      } catch (err) {
        setError('Falha ao carregar a revisão. Ela pode ter expirado ou não existir.');
        setTimeout(() => navigate('/projetos'), 3000);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (err) {
        console.error('Failed to fetch projects', err);
        setError('Falha ao carregar projetos.');
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchReviewData(), fetchProjects()]);
      setLoading(false);
    };

    loadAllData();
  }, [reviewId, navigate]);

  const handleSave = async () => {
    if (!selectedProject || !selectedInspection || !reviewId) {
      alert('Por favor, selecione um projeto e uma inspeção.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post(`/projects/review/${reviewId}/save`, {
        projectId: selectedProject,
        inspectionId: selectedInspection,
      });
      alert('Imagens salvas com sucesso!');
      navigate(`/projetos/${selectedProject}`);
    } catch (err) {
      setError('Falha ao salvar as imagens. Tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  const inspectionsForSelectedProject = projects.find(p => p.id === selectedProject)?.inspections || [];

  if (loading) return <div className="review-container"><p>Carregando dados da revisão...</p></div>;
  if (error) return <div className="review-container error-message"><p>{error}</p></div>;
  if (!reviewData) return null;

  const getImageUrl = (imageId: string) => `/projects/review/${reviewId}/images/${imageId}`;

  return (
    <div className="review-container">
      <h1>Revisão de Imagens Processadas</h1>
      <div className="save-section">
        <h2>Salvar em Inspeção</h2>
        <div className="selectors">
          <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedInspection(''); }}>
            <option value="">Selecione um Projeto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedInspection} onChange={e => setSelectedInspection(e.target.value)} disabled={!selectedProject}>
            <option value="">Selecione uma Inspeção</option>
            {inspectionsForSelectedProject.map(i => <option key={i.id} value={i.id}>{i.inspectionObjective}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={!selectedInspection || saving}>
          {saving ? 'Salvando...' : 'Salvar na Inspeção'}
        </button>
      </div>

      <div className="image-gallery">
        {reviewData.images.map((image) => (
          <div key={image.imageId} className="thumbnail" onClick={() => setModalImage(image)}>
            <AuthenticatedImage src={getImageUrl(image.imageId)} alt={image.originalFileName} />
            <p>{image.originalFileName}</p>
          </div>
        ))}
      </div>

      {modalImage && (
        <div className="modal-backdrop" onClick={() => setModalImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setModalImage(null)}>&times;</span>
            <AuthenticatedImage src={getImageUrl(modalImage.imageId)} alt={modalImage.originalFileName} />
            <h3>Deteções:</h3>
            <ul>
              {modalImage.detections.length > 0 ? modalImage.detections.map((det, i) => (
                <li key={i}>{det.class_name} (Confiança: {(det.confidence * 100).toFixed(2)}%)</li>
              )) : <li>Nenhuma detecção.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewImages;
