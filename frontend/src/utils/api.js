import axios from 'axios';

// Backend API URL - will be set via environment variable for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging for comment requests
    if (config.url && config.url.includes('/comment')) {
      console.log('API Request Details:', {
        fullUrl: `${config.baseURL}${config.url}`,
        url: config.url,
        method: config.method,
        data: config.data,
        dataStringified: JSON.stringify(config.data),
        headers: config.headers,
        baseURL: config.baseURL
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  getUserById: (id) => api.get(`/auth/user/${id}`),
};

// Jobs API
export const jobsAPI = {
  getAllJobs: (params) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  applyForJob: (id, applicationData) => api.post(`/jobs/${id}/apply`, applicationData),
  cancelApplication: (id) => api.delete(`/jobs/${id}/apply`),
  getMyJobs: () => api.get('/jobs/user/my-jobs'),
  getMyApplications: () => api.get('/jobs/user/applications'),
  getJobApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  getMyJobApplications: () => api.get('/jobs/user/my-job-applications'),
};

// Connections API
export const connectionsAPI = {
  getConnections: () => api.get('/connections'),
  getPendingConnections: () => api.get('/connections/pending'),
  sendConnectionRequest: (recipientId, message) => api.post('/connections/request', { recipientId, message }),
  acceptConnection: (connectionId) => api.put(`/connections/${connectionId}/accept`),
  rejectConnection: (connectionId) => api.put(`/connections/${connectionId}/reject`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}`),
  searchUsers: (query) => api.get('/connections/search', { params: { q: query } }),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/conversation/${userId}`, { params }),
  sendMessage: (recipientId, content) => api.post('/messages/send', { recipientId, content }),
  markAsRead: (conversationId) => api.put(`/messages/read/${conversationId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// Posts API
export const postsAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  likePost: (id) => api.post(`/posts/${id}/like`),
  addComment: (id, data) => {
    console.log('addComment called with:', { id, data });
    const url = `/posts/${id}/comment`;
    console.log('Constructed URL:', url);
    return api.post(url, data);
  },
  likeComment: (postId, commentId) => api.post(`/posts/${postId}/comment/${commentId}/like`),
  sharePost: (id) => api.post(`/posts/${id}/share`),
  getUserPosts: (userId, params) => api.get(`/posts/user/${userId}`, { params }),
  getTrendingPosts: (params) => api.get('/posts/trending/feed', { params })
};

export default api; 