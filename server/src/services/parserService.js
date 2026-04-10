import axios from 'axios';
import FormData from 'form-data';  // ← Node.js native FormData (from 'form-data' package)

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001';

/**
 * Send resume file to parser service for parsing
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {String} fileName   - Original file name
 * @param {String} mimeType   - File MIME type
 * @returns {Object} Parsed resume data
 */
export const parseResumeFile = async (fileBuffer, fileName, mimeType) => {
    try {
        // ✅ FIX: Use Node.js 'form-data' package — NOT browser FormData/Blob
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: mimeType,
            knownLength: fileBuffer.length,
        });

        console.log(`📡 Calling parser service at: ${PARSER_SERVICE_URL}/parse`);
        console.log(`📄 File: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

        const response = await axios.post(
            `${PARSER_SERVICE_URL}/parse`,
            formData,
            {
                headers: {
                    // ✅ FIX: Let form-data set its own Content-Type with boundary
                    ...formData.getHeaders(),
                },
                timeout: 120000, // 2 minutes — Gemini is fast, no need for 3 mins
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        console.log('✅ Parser service response:', {
            success: response.data.success,
            hasData: !!response.data.data,
            keys: response.data.data ? Object.keys(response.data.data) : [],
        });

        if (!response.data.success) {
            throw new Error(response.data.error || 'Parser service returned an error');
        }

        const parsedData = response.data.data || {};

        if (!parsedData.skills || parsedData.skills.length === 0) {
            console.warn('⚠️  Parser returned empty skills — LLM may have failed');
        }

        return parsedData;

    } catch (error) {
        // ── Specific error types ─────────────────────────────
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Cannot connect to parser service at', PARSER_SERVICE_URL);
            throw new Error(`Parser service unavailable. Is it running on port 8001?`);
        }
        if (error.code === 'ECONNRESET') {
            console.error('❌ Parser service connection reset — it may have crashed');
            throw new Error('Parser service connection reset. Check parser-service logs.');
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
            console.error('❌ Parser service timed out');
            throw new Error('Parser service timed out after 2 minutes');
        }

        console.error('❌ Parser service error:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data,
        });

        throw new Error(`Failed to parse resume: ${error.message}`);
    }
};

/**
 * Search parsed resumes by single skill
 */
export const searchParsedSkill = async (skill) => {
    try {
        const response = await axios.get(
            `${PARSER_SERVICE_URL}/search`,
            {
                params: { skill },
                timeout: 30000,
            }
        );
        return response.data.data || [];
    } catch (error) {
        console.error('Parser single-skill search error:', error.message);
        return [];
    }
};

/**
 * Search parsed resumes by multiple skills
 */
export const searchParsedSkills = async (skills) => {
    try {
        const skillsString = Array.isArray(skills) ? skills.join(',') : skills;
        const response = await axios.get(
            `${PARSER_SERVICE_URL}/search-multiple`,
            {
                params: { skills: skillsString },
                timeout: 30000,
            }
        );
        return response.data.data || [];
    } catch (error) {
        console.error('Parser multi-skill search error:', error.message);
        return [];
    }
};

/**
 * Health check — is parser service running?
 */
export const isParserServiceHealthy = async () => {
    try {
        const response = await axios.get(`${PARSER_SERVICE_URL}/docs`, { timeout: 5000 });
        return response.status === 200;
    } catch {
        return false;
    }
};