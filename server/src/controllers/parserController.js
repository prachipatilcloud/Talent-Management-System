import Candidate from "../models/Candidate.js";
import { getGoogleDriveInstance } from '../config/googleDrive.js';
import { parseResumeFile } from '../services/parserService.js';

/**
 * Parse resume and create/link candidate
 * - Checks if candidate exists by email (deduplication)
 * - Parses resume via parser service
 * - Uploads resume to Google Drive
 * - Combines skills from manual + parsed sources
 * - Stores all data in single candidate record
 */
export const parseAndCreateCandidate = async (req, res, next) => {
  try {
    const { firstName, lastName, experience, jobRole } = req.body;
    let { email, skills } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName, email, and resume file are required'
      });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    // ✅ DEDUPLICATION: Check for existing candidate by email
    let candidate = await Candidate.findOne({ email });
    const isNewCandidate = !candidate;

    // Parse resume using parser service
    let parsedData = {};
    let parseError = null;

    try {
      console.log('📤 Sending resume to parser service:', {
        email,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      parsedData = await parseResumeFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      console.log('✓ Resume parsed successfully:', { 
        email, 
        parsed_skills: parsedData.skills?.length || 0,
        parsed_experience: parsedData.experience?.length || 0,
        parsed_projects: parsedData.projects?.length || 0,
        target_role: parsedData.target_role || 'N/A'
      });
    } catch (error) {
      parseError = error.message;
      console.error('❌ Resume parsing failed:', { 
        email, 
        error: parseError,
        stack: error.stack 
      });
      // Don't fail the request if parsing fails - continue with manual data
    }

    // Upload resume to Google Drive
    let driveFileId = null;
    let fileUrl = null;

    try {
      const gdrive = getGoogleDriveInstance();
      if (gdrive.isAuthenticated()) {
        const result = await gdrive.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        driveFileId = result.id;
        fileUrl = `https://drive.google.com/file/d/${result.id}/view`;
        console.log('✓ Resume uploaded to Google Drive:', driveFileId);
      } else {
        console.warn('⚠ Google Drive not authenticated, resume not uploaded');
      }
    } catch (error) {
      console.warn('⚠ Google Drive upload failed:', error.message);
      // Don't fail the request if Google Drive upload fails
    }

    // Prepare skills data
    const manualSkills = skills 
      ? (typeof skills === 'string' ? JSON.parse(skills) : skills)
      : [];
    
    const parsedSkills = parsedData.skills || [];
    
    // ✅ DEDUPLICATION: Combine and deduplicate skills
    const allSkills = [...new Set([...manualSkills, ...parsedSkills])];

    if (isNewCandidate) {
      // ✅ CREATE NEW CANDIDATE
      candidate = await Candidate.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        phone: req.body.phone ? req.body.phone.replace(/\D/g, "") : '',
        skills: allSkills,
        experience: experience || parsedData.experience?.length || 0,
        jobRole: jobRole || parsedData.target_role || '',
        resume: {
          fileName: req.file.originalname,
          driveFileId: driveFileId || '',
          url: fileUrl || ''
        },
        parsedResumeData: Object.keys(parsedData).length > 0 ? {
          name: parsedData.name || '',
          aiExtractedSkills: parsedSkills,
          aiExtractedExperience: parsedData.experience || [],
          aiExtractedProjects: parsedData.projects || [],
          targetRole: parsedData.target_role || '',
          parsedAt: new Date()
        } : null,
        skillsSources: {
          manual: manualSkills,
          parsed: parsedSkills
        },
        hasParseData: Object.keys(parsedData).length > 0,
        addedBy: req.user._id
      });

      console.log('✓ New candidate created:', { email, candidateId: candidate._id });

      return res.status(201).json({
        success: true,
        message: 'New candidate created with parsed resume data',
        candidate,
        parseStatus: Object.keys(parsedData).length > 0 ? 'success' : 'partial',
        parseError: parseError || null
      });

    } else {
      // ✅ UPDATE EXISTING CANDIDATE (Linking)
      candidate.firstName = firstName.trim();
      candidate.lastName = lastName.trim();
      candidate.experience = experience || parsedData.experience?.length || candidate.experience;
      candidate.jobRole = jobRole || parsedData.target_role || candidate.jobRole;
      
      // Update skills combining both sources
      candidate.skills = allSkills;
      candidate.skillsSources = {
        manual: manualSkills,
        parsed: parsedSkills
      };

      // Update parsed data
      if (Object.keys(parsedData).length > 0) {
        candidate.parsedResumeData = {
          name: parsedData.name || '',
          aiExtractedSkills: parsedSkills,
          aiExtractedExperience: parsedData.experience || [],
          aiExtractedProjects: parsedData.projects || [],
          targetRole: parsedData.target_role || '',
          parsedAt: new Date()
        };
        candidate.hasParseData = true;
      }

      // Update resume if new one uploaded
      if (driveFileId) {
        // Optionally delete old resume from Google Drive
        if (candidate.resume?.driveFileId && candidate.resume.driveFileId !== driveFileId) {
          try {
            const gdrive = getGoogleDriveInstance();
            if (gdrive.isAuthenticated()) {
              await gdrive.deleteFile(candidate.resume.driveFileId);
              console.log('✓ Old resume deleted from Google Drive');
            }
          } catch (err) {
            console.warn('⚠ Could not delete old resume:', err.message);
          }
        }

        candidate.resume = {
          fileName: req.file.originalname,
          driveFileId,
          url: fileUrl
        };
      }

      await candidate.save();

      console.log('✓ Existing candidate updated:', { email, candidateId: candidate._id });

      return res.status(200).json({
        success: true,
        message: 'Existing candidate updated with parsed resume data',
        candidate,
        parseStatus: Object.keys(parsedData).length > 0 ? 'success' : 'partial',
        parseError: parseError || null
      });
    }

  } catch (error) {
    console.error('Error in parseAndCreateCandidate:', error.message);
    next(error);
  }
};

/**
 * Get parsed resume data for a specific candidate
 */
export const getParsedResumeData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id, 'parsedResumeData hasParseData skillsSources');

    if (!candidate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidate not found' 
      });
    }

    if (!candidate.hasParseData) {
      return res.status(404).json({
        success: false,
        message: 'No parsed resume data available for this candidate'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...candidate.parsedResumeData.toObject(),
        skillsSources: candidate.skillsSources
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Debug endpoint - Get candidate data for troubleshooting
 * Shows exact structure of parsed data and skill sources
 */
export const getDebugCandidateData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id).select(
      'firstName lastName email skills skillsSources hasParseData parsedResumeData'
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: candidate._id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        hasParseData: candidate.hasParseData,
        skillsSources: candidate.skillsSources || { manual: [], parsed: [] },
        skills: candidate.skills,
        parsedResumeData: candidate.parsedResumeData || null,
        debug: {
          manualSkillsCount: (candidate.skillsSources?.manual || []).length,
          parsedSkillsCount: (candidate.skillsSources?.parsed || []).length,
          totalSkillsCount: candidate.skills.length,
          message: 'Use this data to verify skills were extracted correctly'
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Re-parse an existing candidate's resume
 */
export const reparseCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    if (!req.file && !candidate.resume?.driveFileId) {
      return res.status(400).json({
        success: false,
        message: 'No resume provided and no existing resume found'
      });
    }

    // Use new file if provided, otherwise use existing
    let fileBuffer = req.file?.buffer;
    let fileName = req.file?.originalname;

    if (!fileBuffer && candidate.resume?.driveFileId) {
      console.log('⚠ Re-parsing with existing resume file');
      // In a real scenario, you'd download from Google Drive
      return res.status(400).json({
        success: false,
        message: 'Please upload a new resume file to re-parse'
      });
    }

    // Parse the resume
    let parsedData = {};
    let parseError = null;

    try {
      parsedData = await parseResumeFile(
        fileBuffer,
        fileName,
        req.file?.mimetype || 'application/pdf'
      );
      console.log('✓ Resume re-parsed successfully');
    } catch (error) {
      parseError = error.message;
      return res.status(500).json({
        success: false,
        message: 'Failed to parse resume',
        error: parseError
      });
    }

    // Update parsed data
    const parsedSkills = parsedData.skills || [];
    candidate.parsedResumeData = {
      name: parsedData.name || '',
      aiExtractedSkills: parsedSkills,
      aiExtractedExperience: parsedData.experience || [],
      aiExtractedProjects: parsedData.projects || [],
      targetRole: parsedData.target_role || '',
      parsedAt: new Date()
    };
    candidate.hasParseData = true;

    // Update combined skills
    const manualSkills = candidate.skillsSources?.manual || [];
    const allSkills = [...new Set([...manualSkills, ...parsedSkills])];
    candidate.skills = allSkills;
    candidate.skillsSources.parsed = parsedSkills;

    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Candidate resume re-parsed successfully',
      candidate,
      parseStatus: 'success'
    });

  } catch (error) {
    next(error);
  }
};
