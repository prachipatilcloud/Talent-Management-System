import express from 'express';
import multer from 'multer';
import { authorize, protect } from '../middlewares/auth.js';
import { addCandidate, deleteCandidate, downloadResume, getAllCandidates, getAllSkills, getCandidateById, getStatusCounts, updateCandidate, updateCandidateStatus } from '../controllers/candidateController.js';
import interviewRoute from './interviewRoute.js';
import { addInterviewRound } from '../controllers/interviewController.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(), //store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB file size limit
})

router.use(protect);

router.use('/:id/rounds', interviewRoute);

router.get('/stats/status-counts', getStatusCounts)
router.get('/stats/skills', getAllSkills)
router.get('/', getAllCandidates)
router.get('/:id', getCandidateById)
router.get('/:id/resume', downloadResume)

router.post('/', authorize('admin', 'hr'), upload.single('resume'), addCandidate);
router.post('/:id/interviews', authorize('admin', 'hr'), addInterviewRound);


router.put('/:id', authorize('admin', 'hr'), upload.single('resume'), updateCandidate)
router.patch('/:id/status', authorize('admin', 'hr'), updateCandidateStatus)
router.delete('/:id', authorize('admin'), deleteCandidate)

export default router;