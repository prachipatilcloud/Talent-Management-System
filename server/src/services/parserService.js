import axios from 'axios';

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001';

/**
 * Send resume file to parser service for parsing
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {String} fileName - Original file name
 * @param {String} mimeType - File MIME type
 * @returns {Object} Parsed resume data {name, email, skills, experience, projects, target_role}
 */
export const parseResumeFile = async (fileBuffer, fileName, mimeType) => {
  try {
    const formData = new FormData();
    
    // Create blob from buffer
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, fileName);
    
    console.log(`📡 Calling parser service at: ${PARSER_SERVICE_URL}/parse`);

    const response = await axios.post(
      `${PARSER_SERVICE_URL}/parse`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000 // 180 second timeout (3 minutes) for parsing - LLM/Ollama can be slow
      }
    );
    
    console.log('✅ Parser service response received:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : []
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Parser service returned error');
    }

    const parsedData = response.data.data || {};
    
    // Validate parsed data
    if (!parsedData.skills || parsedData.skills.length === 0) {
      console.warn('⚠️  Parser returned empty skills array');
    }

    return parsedData;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to parser service at', PARSER_SERVICE_URL);
      console.error('   Make sure parser service is running: python app.py in parser-service folder');
      throw new Error(`Parser service unavailable at ${PARSER_SERVICE_URL}. Is it running?`);
    }
    if (error.code === 'ENOTFOUND') {
      console.error('❌ Parser service URL not found:', PARSER_SERVICE_URL);
      throw new Error(`Invalid parser service URL: ${PARSER_SERVICE_URL}`);
    }
    if (error.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
      console.error('❌ Parser service timeout - resume parsing took too long');
      throw new Error('Parser service timeout - resume too complex or service overloaded');
    }
    
    console.error('❌ Parser service error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

/**
 * Search parsed resumes in parser service by single skill
 * @param {String} skill - Skill to search for
 * @returns {Array} Array of resumes containing the skill
 */
export const searchParsedSkill = async (skill) => {
  try {
    const response = await axios.get(
      `${PARSER_SERVICE_URL}/search?skill=${encodeURIComponent(skill)}`,
      { timeout: 30000 }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Parser search error for single skill:', error.message);
    return [];
  }
};

/**
 * Search parsed resumes in parser service by multiple skills
 * @param {String|Array} skills - Skills to search for (comma-separated string or array)
 * @returns {Array} Array of resumes containing any of the skills
 */
export const searchParsedSkills = async (skills) => {
  try {
    // Convert array to comma-separated string if needed
    const skillsString = Array.isArray(skills) 
      ? skills.join(',') 
      : skills;
    
    const response = await axios.get(
      `${PARSER_SERVICE_URL}/search-multiple?skills=${encodeURIComponent(skillsString)}`,
      { timeout: 30000 }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Parser search error for multiple skills:', error.message);
    return [];
  }
};

/**
 * Check if parser service is healthy/reachable
 * @returns {Boolean} True if service is reachable
 */
export const isParserServiceHealthy = async () => {
  try {
    const response = await axios.get(
      `${PARSER_SERVICE_URL}/resumes`,
      { timeout: 5000 }
    );
    return response.status === 200;
  } catch (error) {
    console.warn('Parser service health check failed:', error.message);
    return false;
  }
};
