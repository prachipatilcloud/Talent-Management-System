import express from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { getMyInterviews, submitFeedback } from '../controllers/interviewController.js';

const router = express.Router();

router.get("/my-interviews", protect, authorize('interviewer', 'admin'), getMyInterviews);
router.patch('/candidates/:id/rounds/:roundId/feedback', protect, authorize('interviewer', 'hr', 'admin'), submitFeedback)


export default router;