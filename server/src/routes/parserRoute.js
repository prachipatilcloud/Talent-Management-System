import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/auth.js';
import {
  parseAndCreateCandidate,
  getParsedResumeData,
  reparseCandidate,
  getDebugCandidateData
} from '../controllers/parserController.js';
import { isParserServiceHealthy } from '../services/parserService.js';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOC, DOCX
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

/**
 * GET /api/parser/health
 * Check if parser service is healthy and responsive
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const isHealthy = await isParserServiceHealthy();
    const responseTime = Date.now() - startTime;

    if (isHealthy) {
      return res.status(200).json({
        success: true,
        status: 'healthy',
        parserServiceUrl: process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001',
        responseTime: `${responseTime}ms`,
        message: 'Parser service is ready for resume parsing'
      });
    } else {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        parserServiceUrl: process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001',
        message: 'Parser service is not responding. Please ensure:',
        instructions: [
          '1. Parser service is running: cd parser-service && python app.py',
          '2. Ollama is running: ollama serve',
          '3. Ollama model is loaded: ollama pull gemma3n',
          '4. Check PARSER_SERVICE_URL in .env file'
        ]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/parser/parse-candidate
 * Parse resume and create/link candidate
 * Body: {
 *   firstName: String (required),
 *   lastName: String (required),
 *   email: String (required),
 *   phone: String (optional),
 *   skills: JSON string array (optional),
 *   experience: Number (optional),
 *   jobRole: String (optional)
 * }
 * File: resume (required)
 */
router.post(
  '/parse-candidate',
  authorize('admin', 'hr'),
  upload.single('resume'),
  parseAndCreateCandidate
);

/**
 * GET /api/parser/candidates/:id/parsed-data
 * Get parsed resume data for a candidate
 */
router.get(
  '/candidates/:id/parsed-data',
  getParsedResumeData
);

/**
 * POST /api/parser/candidates/:id/reparse
 * Re-parse an existing candidate's resume
 * Can upload new file or re-parse existing
 */
router.post(
  '/candidates/:id/reparse',
  authorize('admin', 'hr'),
  upload.single('resume'),
  reparseCandidate
);

/**
 * GET /api/parser/debug/candidates/:id
 * Debug endpoint - Shows exact candidate data structure
 * Useful for troubleshooting skill extraction issues
 */
router.get(
  '/debug/candidates/:id',
  getDebugCandidateData
);

export default router;
