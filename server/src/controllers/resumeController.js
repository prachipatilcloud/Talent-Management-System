import axios from 'axios';

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001';

/**
 * Search resumes in parser service by skill
 * GET /api/candidates/search-parsed?skill=React
 */
export const searchParsedResumes = async (req, res) => {
    try {
        const { skill, skills } = req.query;

        // ── Validate ─────────────────────────────────────────
        if (!skill && !skills) {
            return res.status(400).json({
                success: false,
                message: 'Provide ?skill=React or ?skills=React,Node.js'
            });
        }

        // ── Forward JWT token from HR/Admin to parser service ─
        // Parser service requires auth — forward the token
        const authHeader = req.headers.authorization;

        let response;

        if (skills) {
            // Multi-skill search
            const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
            if (skillList.length === 0) {
                return res.status(400).json({ success: false, message: 'No valid skills provided' });
            }

            response = await axios.get(
                `${PARSER_SERVICE_URL}/search-multiple`,
                {
                    params: { skills: skillList.join(',') },
                    headers: authHeader ? { Authorization: authHeader } : {},
                    timeout: 30000,
                }
            );
        } else {
            // Single skill search
            response = await axios.get(
                `${PARSER_SERVICE_URL}/search`,
                {
                    params: { skill: skill.trim() },
                    headers: authHeader ? { Authorization: authHeader } : {},
                    timeout: 30000,
                }
            );
        }

        return res.json({
            success: true,
            count: response.data.count || response.data.data?.length || 0,
            data: response.data.data || [],
        });

    } catch (error) {
        // Parser service not running
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Resume parser service is not running',
                hint: 'Start it with: uvicorn main:app --port 8001'
            });
        }

        // Auth error from parser
        if (error.response?.status === 401 || error.response?.status === 403) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to search parsed resumes'
            });
        }

        console.error('searchParsedResumes error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to search parsed resumes',
            error: error.message
        });
    }
};