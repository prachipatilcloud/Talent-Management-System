import express from 'express';
import Candidate from '../models/Candidate.js';

const router = express.Router();

router.get('/candidate/:candidateId', async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.candidateId);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        // Return only public-safe data
        const publicData = {
            _id: candidate._id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            jobRole: candidate.jobRole,
            skills: candidate.skills,
            resume: candidate.resume,
            status: candidate.status,
            interviewRounds: candidate.interviewRounds,
            parsedResumeData: candidate.parsedResumeData
        };

        res.status(200).json({ success: true, candidate: publicData });
    } catch (error) {
        console.error('Public route error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/candidate/:candidateId/client-feedback', async (req, res) => {
    try {
        const { interviewerName, company, rating, feedback } = req.body;
        
        const candidate = await Candidate.findById(req.params.candidateId);
        if (!candidate) {
             return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        candidate.clientFeedback.push({
            interviewerName,
            company,
            rating,
            feedback,
            submittedAt: new Date()
        });

        await candidate.save();
        res.status(200).json({ success: true, message: 'Feedback submitted successfully' });

    } catch (error) {
       console.error('Public feedback error:', error);
       res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
});

export default router;
