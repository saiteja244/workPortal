import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://job-app-production-c883.up.railway.app/api';

// Create axios instance with auth token
const createApiInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

const aiAPI = {
  /**
   * Extract skills from text content
   * @param {string} content - Text content to analyze
   * @param {string} model - AI model to use
   * @returns {Promise<Object>} Extracted skills
   */
  extractSkills: async (content, model = 'open-source') => {
    try {
      const api = createApiInstance();
      const response = await api.post('/ai/extract-skills', { content, model });
      return response.data;
    } catch (error) {
      console.error('Skill extraction error:', error);
      throw error;
    }
  },

  /**
   * Calculate job-candidate match score
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Match analysis
   */
  calculateJobMatch: async (jobId) => {
    try {
      const api = createApiInstance();
      const response = await api.post('/ai/job-match', { jobId });
      return response.data;
    } catch (error) {
      console.error('Job matching error:', error);
      throw error;
    }
  },

  /**
   * Get personalized job recommendations
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Job recommendations
   */
  getJobRecommendations: async (params = {}) => {
    try {
      const api = createApiInstance();
      const response = await api.get('/ai/job-recommendations', { params });
      return response.data;
    } catch (error) {
      console.error('Job recommendations error:', error);
      throw error;
    }
  },

  /**
   * Analyze job description
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} Analysis results
   */
  analyzeJobDescription: async (jobDescription) => {
    try {
      const api = createApiInstance();
      const response = await api.post('/ai/analyze-job', { jobDescription });
      return response.data;
    } catch (error) {
      console.error('Job analysis error:', error);
      throw error;
    }
  },

  /**
   * Generate application suggestions
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Application suggestions
   */
  getApplicationSuggestions: async (jobId) => {
    try {
      const api = createApiInstance();
      const response = await api.post('/ai/application-suggestions', { jobId });
      return response.data;
    } catch (error) {
      console.error('Application suggestions error:', error);
      throw error;
    }
  },

  /**
   * Batch skill extraction
   * @param {Array} contents - Array of content objects
   * @returns {Promise<Object>} Batch extraction results
   */
  batchSkillExtraction: async (contents) => {
    try {
      const api = createApiInstance();
      const response = await api.post('/ai/batch-skill-extraction', { contents });
      return response.data;
    } catch (error) {
      console.error('Batch skill extraction error:', error);
      throw error;
    }
  },

  /**
   * Get user's match history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Match history
   */
  getMatchHistory: async (params = {}) => {
    try {
      const api = createApiInstance();
      const response = await api.get('/ai/match-history', { params });
      return response.data;
    } catch (error) {
      console.error('Match history error:', error);
      throw error;
    }
  }
};

export default aiAPI; 