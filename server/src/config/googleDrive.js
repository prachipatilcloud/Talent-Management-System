import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import GoogleDriveManager from '../services/googleDriveService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let googleDriveInstance = null;

// Initialize Google Drive Manager
export const initializeGoogleDrive = async () => {
  try {
    // Load credentials from client_secret_.json
    const credentialsPath = path.join(__dirname, '../../client_secret_.json');
    const credentialsFile = await fs.readFile(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsFile);
    
    // Extract client ID and secret
    const clientId = credentials.web?.client_id || credentials.installed?.client_id;
    const clientSecret = credentials.web?.client_secret || credentials.installed?.client_secret;

    if (!clientId || !clientSecret) {
      throw new Error('Could not find client ID or secret in client_secret_.json');
    }

    googleDriveInstance = new GoogleDriveManager(clientId, clientSecret);
    await googleDriveInstance.initialize();
    
    console.log('✓ Google Drive Manager initialized');
    return googleDriveInstance;
  } catch (error) {
    console.error('Error initializing Google Drive:', error.message);
    throw error;
  }
};

// Get Google Drive instance
export const getGoogleDriveInstance = () => {
  if (!googleDriveInstance) {
    throw new Error('Google Drive Manager not initialized. Call initializeGoogleDrive first.');
  }
  return googleDriveInstance;
};

export default { initializeGoogleDrive, getGoogleDriveInstance };