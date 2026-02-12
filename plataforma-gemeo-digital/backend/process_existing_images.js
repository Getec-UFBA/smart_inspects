const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { Readable } = require('stream');
const FormData = require('form-data');

// Inlined ImageProcessingService class
class ImageProcessingService {
  constructor() {
    this.pythonServiceUrl = 'http://localhost:8001'; // Hardcoded for script
  }

  async processImage(imagePath) { 
    try {
      const formData = new FormData();
      formData.append('file', Readable.from(require('fs').createReadStream(imagePath)), {
        filename: require('path').basename(imagePath),
        contentType: 'image/png', // Assuming PNG for now, adjust if needed
      });

      const response = await axios.post(`${this.pythonServiceUrl}/process-image/`, formData, {
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

  // Not needed for this script, but keeping for completeness if it were a full module
  async switchModel(modelName) { 
    try {
      const response = await axios.get(`${this.pythonServiceUrl}/switch-model/${modelName}`);
      return response.data.message;
    } catch (error) {
      console.error('Error switching model with Python service:', error);
      throw new Error('Failed to switch model with Python service.');
    }
  }
}

// Paths are now relative to the backend directory
const DB_PATH = path.resolve(__dirname, 'db.json');
const UPLOAD_DIR = path.resolve(__dirname, 'public/uploads/processed_images');

async function processExistingImages() {
    console.log('Starting to process existing images for detections...');
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(data);

        let modified = false;
        const imageProcessingService = new ImageProcessingService();

        for (const project of db.projects) {
            if (project.folders && Array.isArray(project.folders)) {
                for (const folder of project.folders) {
                    if (folder.images && Array.isArray(folder.images)) {
                        for (let i = 0; i < folder.images.length; i++) {
                            const image = folder.images[i];

                            // Only process if image has a URL and empty detections
                            if (image.url && Array.isArray(image.detections) && image.detections.length === 0) {
                                const relativeImagePath = image.url.replace('/files/processed_images', ''); // Remove the /files/processed_images prefix
                                const fullImagePath = path.join(UPLOAD_DIR, relativeImagePath);

                                try {
                                    // Check if the file actually exists before processing
                                    await fs.access(fullImagePath);
                                    console.log(`Processing image: ${fullImagePath}`);
                                    const processedResponse = await imageProcessingService.processImage(fullImagePath);
                                    
                                    if (processedResponse.detections && processedResponse.detections.length > 0) {
                                        image.detections = processedResponse.detections;
                                        modified = true;
                                        console.log(`- Added ${processedResponse.detections.length} detections for ${path.basename(image.url)}`);
                                    } else {
                                        console.log(`- No new detections found for ${path.basename(image.url)}`);
                                    }
                                } catch (error) { // Combined catch block
                                    if (error.code === 'ENOENT') {
                                        console.warn(`- Image file not found for ${image.url}. Skipping processing.`);
                                    } else if (error.message && error.message.includes('Python service')) { 
                                        console.error(`- Error processing image ${image.url} with Python service:`, error.message);
                                    } else {
                                        console.error(`- An unexpected error occurred while processing ${image.url}:`, error);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (modified) {
            await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
            console.log('db.json has been updated with new image detections.');
        } else {
            console.log('No images with empty detections found or no new detections added. No changes made to db.json.');
        }

    } catch (error) {
        console.error('Error in processExistingImages script:', error);
    }
    console.log('Finished processing existing images.');
}

processExistingImages();
