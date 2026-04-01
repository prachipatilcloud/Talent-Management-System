import Candidate from "../models/Candidate.js";
import { getGoogleDriveInstance } from '../config/googleDrive.js';

const VALID_STATUSES = ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected', 'On Hold', 'Talent Pool'];

// Helper function to map experience levels to ranges
const getExperienceRange = (level) => {
    const ranges = {
        'Junior':    { min: 0,  max: 2   },
        'Mid-Level': { min: 3,  max: 5   },
        'Senior':    { min: 6,  max: 10  },
        'Lead':      { min: 11, max: 100 },
    };
    return ranges[level] || null;
};

export const addCandidate = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, skills, experience, jobRole } = req.body;

        if (!firstName || !lastName || !email || !phone || !skills || !experience || !jobRole) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Resume file is required' });
        }

        const existingCandidate = await Candidate.findOne({ email: email.toLowerCase() });
        if (existingCandidate) {
            return res.status(400).json({ success: false, message: 'Candidate with this email already exists' });
        }

        const normalizedPhone = phone.replace(/\D/g, "");
        if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits and start with 6-9." });
        }

        let driveFileId = null;
        let fileUrl = null;

        try {
            const gdrive = getGoogleDriveInstance();
            if (gdrive.isAuthenticated()) {
                const result = await gdrive.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
                driveFileId = result.id;
                fileUrl = `https://drive.google.com/file/d/${result.id}/view`;
                console.log('✓ Resume uploaded to Google Drive:', result.id);
            } else {
                return res.status(401).json({ success: false, message: 'Google Drive not authenticated. Please complete OAuth flow first.' });
            }
        } catch (error) {
            console.error('Google Drive upload failed:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to upload resume to Google Drive: ' + error.message });
        }

        const candidate = await Candidate.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: normalizedPhone,
            skills: skills ? JSON.parse(skills) : [],
            experience,
            jobRole,
            resume: {
                fileName: req.file.originalname,
                driveFileId,
                url: fileUrl,
            },
            addedBy: req.user._id,
        });

        res.status(201).json({ success: true, message: 'Candidate added successfully', candidate });

    } catch (error) {
        next(error);
    }
};

export const getAllCandidates = async (req, res, next) => {
    try {
        const { search, status, jobRole, sortby, skills, experienceLevel, page = 1, limit = 10 } = req.query;
        
        let query = {};
        const andConditions = [];
        
        // OPTIMIZED: Use MongoDB text search instead of regex for general search
        if (search) {
            // Use text index for faster search
            query.$text = { $search: search };
        }

        if (status) {
            // Handle multiple status values: ?status=Applied&status=Shortlisted
            const statusArray = Array.isArray(status) ? status : [status];
            andConditions.push({ status: { $in: statusArray } });
        }
        
        if (jobRole) {
            andConditions.push({ jobRole: { $regex: jobRole, $options: 'i' } });
        }
        
        if (experienceLevel) {
            const range = getExperienceRange(experienceLevel);
            if (range) andConditions.push({ experience: { $gte: range.min, $lte: range.max } });
        }
        
        // ✅ UPDATED: Skills filter - Search from BOTH manual AND parsed sources
        // Properly combined with other filters using $and and $or
        if (skills) {
            const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
            
            // Search skills in both sources (manual and parsed)
            const skillsOrCondition = {
                $or: [
                    { 'skillsSources.manual': { $in: skillsArray } },
                    { 'skillsSources.parsed': { $in: skillsArray } },
                    // Fallback: also search in the combined skills array (for backward compatibility)
                    { skills: { $in: skillsArray } }
                ]
            };
            andConditions.push(skillsOrCondition);
        }

        // Merge all conditions with $and if we have multiple filters
        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        let sortOption = { createdAt: -1 };
        if (sortby === 'experience') sortOption = { experience: -1 };
        if (sortby === 'oldest')     sortOption = { createdAt:  1 };
        // Add text score sorting when using text search
        if (search) sortOption = { score: { $meta: 'textScore' }, ...sortOption };
        
        const skip  = (Number(page) - 1) * Number(limit);
        
        // OPTIMIZED: Use countDocuments with hint to use index
        const total = await Candidate.countDocuments(query);

        const candidates = await Candidate.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOption)
        .skip(skip)
            .limit(Number(limit))
            .populate('addedBy', 'firstName lastName email')
            .lean(); // OPTIMIZED: lean() for faster queries

        res.status(200).json({
            success: true,
            count: total,
            candidates,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });

    } catch (error) {
        next(error);
    }
};

export const getCandidateById = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
        .populate('addedBy', 'firstName lastName email')
        .populate('interviewRounds.notesAddedBy', 'firstName lastName department')
        
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        res.status(200).json({ success: true, candidate });
        
    } catch (error) {
        next(error);
    }
};

export const updateCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        // ── Scalar fields ────────────────────────────────────────────
        const scalarFields = ['firstName', 'lastName', 'email', 'experience', 'jobRole'];
        scalarFields.forEach(field => {
            if (req.body[field] !== undefined) candidate[field] = req.body[field];
        });
        
        // ── Status — validate before saving ─────────────────────────
        if (req.body.status !== undefined) {
            if (!VALID_STATUSES.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
                });
            }
            candidate.status = req.body.status;
        }

        // ── Skills — arrives as JSON string from FormData ────────────
        if (req.body.skills !== undefined) {
            try {
                candidate.skills = typeof req.body.skills === 'string'
                    ? JSON.parse(req.body.skills)
                    : req.body.skills;
                } catch {
                    return res.status(400).json({ success: false, message: 'Invalid skills format' });
            }
        }

        // ── Phone — normalize and validate ───────────────────────────
        if (req.body.phone !== undefined) {
            const normalizedPhone = req.body.phone.replace(/\D/g, '');
            if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
                return res.status(400).json({ success: false, message: 'Invalid phone number. Must be 10 digits and start with 6-9.' });
            }
            candidate.phone = normalizedPhone;
        }

        // ── Resume — only replace if new file uploaded ───────────────
        if (req.file) {
            try {
                const gdrive = getGoogleDriveInstance();

                if (gdrive.isAuthenticated()) {
                    // Delete old resume from Google Drive
                    if (candidate.resume?.driveFileId) {
                        try {
                            await gdrive.deleteFile(candidate.resume.driveFileId);
                            console.log('✓ Old resume deleted from Google Drive');
                        } catch (err) {
                            console.error('Warning: Could not delete old resume:', err.message);
                        }
                    }

                    const result = await gdrive.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
                    
                    candidate.resume = {
                        fileName:    req.file.originalname,
                        driveFileId: result.id,
                        url:         `https://drive.google.com/file/d/${result.id}/view`,
                    };

                    console.log('✓ New resume uploaded to Google Drive:', result.id);
                } else {
                    return res.status(401).json({ success: false, message: 'Google Drive not authenticated. Please complete OAuth flow first.' });
                }
            } catch (error) {
                console.error('Google Drive upload failed:', error.message);
                return res.status(500).json({ success: false, message: 'Failed to upload resume to Google Drive: ' + error.message });
            }
        }
        
        await candidate.save();
        
        res.status(200).json({ success: true, message: 'Candidate updated successfully', candidate });

    } catch (error) {
        next(error);
    }
};

export const updateCandidateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const candidate = await Candidate.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        res.status(200).json({ success: true, message: 'Candidate status updated successfully', candidate });

    } catch (error) {
        next(error);
    }
};

export const deleteCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        if (candidate.resume?.driveFileId) {
            try {
                const gdrive = getGoogleDriveInstance();
                if (gdrive.isAuthenticated()) {
                    await gdrive.deleteFile(candidate.resume.driveFileId);
                    console.log('✓ Resume deleted from Google Drive:', candidate.resume.driveFileId);
                }
            } catch (error) {
                console.error('Warning: Could not delete resume from Google Drive:', error.message);
            }
        }
        
        await Candidate.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
        
    } catch (error) {
        next(error);
    }
};

export const getStatusCounts = async (req, res, next) => {
    try {
        const statusCounts = await Candidate.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const countsObject = {};
        statusCounts.forEach(item => { countsObject[item._id] = item.count; });
        
        res.status(200).json({ success: true, statusCounts: countsObject });
        
    } catch (error) {
        next(error);
    }
};

export const getAllSkills = async (req, res, next) => {
    try {
        const candidates = await Candidate.find({}, 'skills');
        
        const skillsSet = new Set();
        candidates.forEach(candidate => {
            if (candidate.skills && Array.isArray(candidate.skills)) {
                candidate.skills.forEach(skill => {
                    if (skill && skill.trim()) skillsSet.add(skill.trim());
                });
            }
        });
        
        res.status(200).json({ success: true, skills: Array.from(skillsSet).sort() });

    } catch (error) {
        next(error);
    }
};

export const downloadResume = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }
        
        if (!candidate.resume?.driveFileId) {
            return res.status(404).json({ success: false, message: 'Resume not found for this candidate' });
        }
        
        const gdrive = getGoogleDriveInstance();
        if (!gdrive.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Google Drive not authenticated' });
        }
        
        try {
            const metadata = await gdrive.getFileMetadata(candidate.resume.driveFileId);
            
            const response = await gdrive.drive.files.get(
                { fileId: candidate.resume.driveFileId, alt: 'media' },
                { responseType: 'stream' }
            );
            
            res.setHeader('Content-Type', metadata.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${metadata.name}"`);
            response.data.pipe(res);

        } catch (error) {
            console.error('Error downloading resume:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to download resume: ' + error.message });
        }
        
    } catch (error) {
        next(error);
    }
};