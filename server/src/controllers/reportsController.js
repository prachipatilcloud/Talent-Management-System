import Candidate from "../models/Candidate.js";

/**
 * @desc    Get high-level summary stats for the reports dashboard
 * @route   GET /api/reports/summary
 */
export const getReportsSummary = async (req, res, next) => {
    try {
        const totalCandidates = await Candidate.countDocuments();
        
        // Average rating across all candidates who have feedback
        const avgResult = await Candidate.aggregate([
            { $unwind: "$interviewRounds" },
            { $match: { "interviewRounds.feedback.overallRating": { $exists: true, $ne: null } } },
            { $group: { _id: null, avgRating: { $avg: "$interviewRounds.feedback.overallRating" } } }
        ]);
        
        const avgRating = avgResult.length > 0 ? avgResult[0].avgRating.toFixed(1) : 0;

        // Shortlisted this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const shortlistedThisMonth = await Candidate.countDocuments({
            status: "Shortlisted",
            updatedAt: { $gte: startOfMonth }
        });

        res.status(200).json({
            success: true,
            data: {
                totalCandidates,
                avgRating,
                shortlistedThisMonth
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get list of candidates with aggregated feedback summaries
 * @route   GET /api/reports/candidates
 */
export const getCandidatesReportList = async (req, res, next) => {
    try {
        const { search, skills, round, recommendation, position } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } }
            ];
        }

        if (skills) {
            query.skills = { $regex: skills, $options: "i" };
        }

        if (round && round !== "All Rounds") {
            query["interviewRounds.roundName"] = { $regex: round, $options: "i" };
        }

        if (recommendation && recommendation !== "All Recommendations") {
            query["interviewRounds.feedback.overallRecommendation"] = { $regex: recommendation, $options: "i" };
        }

        if (position && position !== "All Positions") {
            query.jobRole = { $regex: position, $options: "i" };
        }

        // Get total count for pagination
        const totalCandidates = await Candidate.countDocuments(query);
        const totalPages = Math.ceil(totalCandidates / limit);

        // Fetch paginated candidates
        const candidates = await Candidate.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const reportList = candidates.map(c => {
            const feedbacks = c.interviewRounds
                .filter(r => r.feedback && r.feedback.overallRating)
                .map(r => r.feedback);
            
            const avgRating = feedbacks.length > 0 
                ? (feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(1)
                : 0;
            
            const roundsCleared = c.interviewRounds.filter(r => r.status === 'passed').length;
            const totalRounds = c.interviewRounds.length;

            const latestFeedback = feedbacks.length > 0 ? feedbacks[feedbacks.length - 1] : null;

            return {
                _id: c._id,
                name: `${c.firstName} ${c.lastName}`,
                jobRole: c.jobRole,
                avgRating,
                roundsCleared,
                totalRounds,
                recommendation: latestFeedback ? latestFeedback.overallRecommendation : (c.status === 'Selected' ? 'Shortlisted' : 'In Progress')
            };
        });

        res.status(200).json({
            success: true,
            data: reportList,
            pagination: {
                totalResults: totalCandidates,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get detailed round-by-round feedback for a single candidate
 * @route   GET /api/reports/candidates/:id
 */
export const getCandidateDetailedReport = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('interviewRounds.feedback.submittedBy', 'firstName lastName')
            .populate('interviewRounds.notesAddedBy', 'firstName lastName');

        if (!candidate) {
            return res.status(404).json({ success: false, message: "Candidate not found" });
        }

        // Compute overall metrics
        const feedbacks = candidate.interviewRounds
            .filter(r => r.feedback && r.feedback.overallRating)
            .map(r => r.feedback);
        
        const avgOverallScore = feedbacks.length > 0 
            ? (feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                candidate,
                metrics: {
                    avgOverallScore,
                    finalStatus: candidate.status,
                    totalRounds: candidate.interviewRounds.length,
                    completedRounds: feedbacks.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
