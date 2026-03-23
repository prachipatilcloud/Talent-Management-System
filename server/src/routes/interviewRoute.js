import express from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { addInterviewRound, addNotesToRound, rescheduleRound } from '../controllers/interviewController.js';

const router = express.Router({ mergeParams: true });

router.post("/", protect, authorize('admin', 'hr'), addInterviewRound)
router.patch("/:roundId/notes",  protect, authorize('admin', 'hr'), addNotesToRound)
router.patch("/:roundId/reschedule",  protect, authorize('admin', 'hr'), rescheduleRound)



export default router;