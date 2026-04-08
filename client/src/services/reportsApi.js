import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const reportsApi = {
    /**
     * Get high-level summary stats
     */
    getSummary: async () => {
        const response = await axios.get(`${API_URL}/reports/summary`, { withCredentials: true });
        return response.data;
    },

    /**
     * Get list of candidates with feedback summaries
     */
    getCandidates: async (filters = {}) => {
        const response = await axios.get(`${API_URL}/reports/candidates`, {
            params: filters,
            withCredentials: true
        });
        return response.data;
    },

    /**
     * Get detailed feedback for a specific candidate
     */
    getCandidateDetail: async (id) => {
        const response = await axios.get(`${API_URL}/reports/candidates/${id}`, { withCredentials: true });
        return response.data;
    }
};

export default reportsApi;
