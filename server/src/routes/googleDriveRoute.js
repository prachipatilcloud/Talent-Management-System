import express from 'express';
import multer from 'multer';
import {
  getAuthUrl,
  handleOAuthCallback,
  checkAuthStatus,
  uploadFile,
  listFiles,
  getFileMetadata,
  deleteFile,
  createFolder,
  downloadFile
} from '../controllers/googleDriveController.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// OAuth routes
router.get('/auth/url', getAuthUrl);
router.get('/oauth2callback', handleOAuthCallback);
router.get('/auth/status', checkAuthStatus);

// File operations
router.post('/upload', upload.single('file'), uploadFile);
router.get('/files', listFiles);
router.get('/files/:fileId', getFileMetadata);
router.delete('/files/:fileId', deleteFile);
router.get('/files/:fileId/download', downloadFile);

// Folder operations
router.post('/folders', createFolder);

export default router;
