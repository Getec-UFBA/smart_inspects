import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';

interface IDetection {
  class_name: string;
  confidence: number;
  box: { x1: number; y1: number; x2: number; y2: number };
}

interface IProcessImageResponse {
  processed_image_base64: string;
  detections: IDetection[];
}

class ImageProcessingService {
  private pythonServiceUrl: string;

  constructor() {
    this.pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
  }

  public async processImage(imagePath: string): Promise<IProcessImageResponse> {
    try {
      const formData = new FormData();
      formData.append('file', Readable.from(require('fs').createReadStream(imagePath)), {
        filename: require('path').basename(imagePath),
        contentType: 'image/png', // Assuming PNG for now, adjust if needed
      });

      const response = await axios.post<IProcessImageResponse>(`${this.pythonServiceUrl}/process-image/`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'json', // Expect JSON response
      });

      return response.data; // This will be the processed image data and detections
    } catch (error) {
      console.error('Error processing image with Python service:', error);
      throw new Error('Failed to process image with Python service.');
    }
  }

  public async switchModel(modelName: 'best' | 'last'): Promise<string> {
    try {
      const response = await axios.get(`${this.pythonServiceUrl}/switch-model/${modelName}`);
      return response.data.message;
    } catch (error) {
      console.error('Error switching model with Python service:', error);
      throw new Error('Failed to switch model with Python service.');
    }
  }
}

export default ImageProcessingService;
