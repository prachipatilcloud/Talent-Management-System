import Candidate from "../models/Candidate.js";
import User from "../models/User.js";

export const addInterviewRound = async (req, res, next) => {
    try {
        const {
            roundName,
            interviewers,
            scheduledDate,
            interviewMode,
            interviewLink,
            officeLocation,
            notes,
        } = req.body;

        if (!roundName) {
            return res.status(400).json({
                success: false,
                message: 'Round name is required'
            });
        }
        if (!scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled date is required'
            });
        }
        if (!interviewers || interviewers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one interviewer is required'
            });
        }

        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(400).json({
                success: false,
                message: 'Candidate not found'
            });

        }

        // validate all interviewers exist and have role=interviewers
        const interviewerDocs = await User.find({ _id: { $in: interviewers } });
        if (interviewerDocs.length !== interviewers.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more interviewer not found'
            });
        }
        const invalidInterviewer = interviewerDocs.find(u => !['interviewer', 'hr','admin'].includes(u.role));
        if (invalidInterviewer) {
            return res.status(400).json({
                success: false,
                message: `${invalidInterviewer.firstName} ${invalidInterviewer.lastName} is not an interviewer`
            });
        }

        const newRound = {
            roundName,
            interviewers,
            scheduledDate: scheduledDate || null,
            interviewMode: interviewMode || null,
            interviewLink: interviewMode === 'Remote' ? interviewLink : null,
            officeLocation: interviewMode === 'In-office' ? officeLocation : null,
            notes: notes || null,
            status: 'pending'
        }

        candidate.interviewRounds.push(newRound);

        if (candidate.status === 'Applied' || candidate.status === 'Screening') {
            candidate.status = 'Interviewing';
        }

        await candidate.save();

        res.status(200).json({
            success: true,
            message: 'Interview round added successfully',
            round: candidate.interviewRounds[candidate.interviewRounds.length - 1],
            candidate
        })


    } catch (error) {
        next(error);
    }
}

export const addNotesToRound = async (req, res, next) => {
    try {
        const { id, roundId } = req.params;
        const { notes, tags } = req.body;

        const candidate = await Candidate.findById(id);
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        const round = candidate.interviewRounds.id(roundId);
        if (!round) {
            return res.status(404).json({
                success: false,
                message: 'Interview round not found'
            });
        }

        if (notes !== undefined) round.notes = notes;
        if (tags !== undefined) round.tags = tags;
        round.notesAddedBy = req.user._id;
        round.notesAddedAt = new Date();

        await candidate.save();

        const updated = await Candidate.findById(id).populate('interviewRounds.notesAddedBy', 'firstName lastName');

        const updatedRound = updated.interviewRounds.id(roundId);

        res.status(200).json({
            success: true,
            message: 'Notes saved successfully',
            round: updatedRound,
            candidate: updated,
        });

    } catch (error) {
        next(error);
    }
}

export const rescheduleRound = async (req, res, next) => {
    try {
        const { id, roundId } = req.params;
        const { interviewers, scheduledDate, interviewMode, interviewLink, officeLocation } = req.body;

        if (!scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'New date is required'
            });
        }

        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(400).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        const round = candidate.interviewRounds.id(roundId);
        if (!round) return res.status(404).json({ success: false, message: 'Round not found' })

        round.scheduledDate = new Date(scheduledDate);
        round.rescheduledDate = new Date(scheduledDate);
        round.interviewMode = interviewMode || round.interviewMode;
        round.interviewLink = interviewMode === 'Remote' ? interviewLink : null;
        round.officeLocation = interviewMode === 'In-office' ? officeLocation : null;
        if (interviewers?.length > 0) round.interviewers = interviewers;

        await candidate.save();

        res.status(200).json({
            success: true,
            message: 'Rescheduled successfully',
            round,
            candidate,
        });

    } catch (error) {
        next(error);
    }
}




export const getMyInterviews = async (req, res, next) => {
    try {

        const candidates = await Candidate.find({
            'interviewRounds.interviewers': req.user._id
        }).populate('interviewRounds.interviewers', 'firstName lastName email');

        const myInterviews = [];
        candidates.forEach(candidate => {
            candidate.interviewRounds.forEach(round => {
                const isAssigned = round.interviewers?.some(iv => iv._id.toString() === req.user._id.toString())
                if (isAssigned) {
                    myInterviews.push({
                        candidateId: candidate._id,
                        candidateName: `${candidate.firstName} ${candidate.lastName}`,
                        jobRole: candidate.jobRole,
                        roundId: round._id,
                        roundName: round.roundName,
                        scheduledDate: round.scheduledDate,
                        interviewMode: round.interviewMode,
                        interviewLink: round.interviewLink,
                        officeLocation: round.officeLocation,
                        status: round.status,
                        hasFeedback: !!(round.feedback?.comments || round.feedback?.rating),
                    })
                }
            })
        })
        myInterviews.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

        res.status(200).json({
            success: true,
            interviews: myInterviews,
        })

    } catch (error) {
        next(error);
    }
};

export const submitFeedback = async (req, res, next) => {
    try {

        const { id, roundId } = req.params;
        const { comments, rating, recommendation } = req.body;

        if (!rating || !recommendation) {
            return res.status(400).json({
                success: false,
                message: "Rating and recommendation are required"
            })
        }

        const candidate = await Candidate.findById(id);
        if (!candidate) return res.status(404).json({
            success: false,
            message: "Candidate not found"
        })

        const round = candidate.interviewRounds.id(roundId);
        if (!round) return res.status(404).json({
            success: false,
            message: "Interview Round not found"
        })


        const isAssigned = round.interviewers?.some(iv => {
            const ivId = typeof iv === 'object' ? iv._id?.toString() : iv?.toString();

            return ivId === req.user._id.toString();
        });

        if (!isAssigned) return res.status(403).json({
            success: false,
            message: "You aren't assigned to this interview round"
        })

        round.feedback = {
            rating,
            recommendation,
            comments: comments || '',
            submittedBy: req.user._id,
            submittedAt: new Date(),
        }

        await candidate.save();

        res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully', round, candidate
        })

    } catch (error) {
        next(error);
    }
}