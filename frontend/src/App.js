import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import JobList from './components/JobList';
import JobPosting from './components/JobPosting';


import AIDashboard from './components/AIDashboard';
import WalletConnect from './components/WalletConnect';
import Profile from './components/Profile';
import JobDetail from './components/JobDetail';
import Networking from './components/Networking';
import Messaging from './components/Messaging';
import PostFeed from './components/PostFeed';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';
import { jobsAPI } from './utils/api';
import './App.css';

// Main content component
const MainContent = () => {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchRecentJobs = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      const response = await jobsAPI.getAllJobs({ limit: 3, sort: 'createdAt' });
      setRecentJobs(response.data.jobs || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent jobs:', err);
      setError('Failed to load recent jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchRecentJobs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRecentJobs(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchRecentJobs(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-responsive py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-gradient">JobPortal</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your comprehensive platform for job opportunities, professional networking, and career growth.
            Connect with professionals, discover opportunities, and advance your career.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card group hover:scale-105 transition-transform duration-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Browse Jobs</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Explore thousands of job opportunities</p>
              <button
                onClick={() => navigate('/jobs')}
                className="btn-primary w-full"
              >
                Find Jobs
              </button>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 dark:group-hover:bg-success-800 transition-colors">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Network</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Connect with professionals and recruitors</p>
              <button
                onClick={() => navigate('/networking')}
                className="btn-success w-full"
              >
                Connect
              </button>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 dark:group-hover:bg-warning-800 transition-colors">
                <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Get personalized recommendations</p>
              <button
                onClick={() => navigate('/ai-dashboard')}
                className="btn-warning w-full"
              >
                Get Insights
              </button>
            </div>
          </div>

          <div className="card group hover:scale-105 transition-transform duration-200">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Share Updates</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Post career updates and insights</p>
              <button
                onClick={() => navigate('/create-post')}
                className="btn-purple w-full"
              >
                Create Post
              </button>
            </div>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Job Postings</h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-ghost text-sm"
              >
                {refreshing ? (
                  <div className="spinner w-4 h-4" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner w-8 h-8" />
                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading recent jobs...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-error-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{error}</p>
                <button onClick={handleRefresh} className="btn-primary mt-4">
                  Try Again
                </button>
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300">No recent jobs found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentJobs.map((job) => (
                  <div key={job._id} className="card hover:shadow-medium transition-shadow duration-200">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {job.title}
                        </h3>
                        <span className="badge badge-primary ml-2 flex-shrink-0">
                          {job.type}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {job.company}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-success-600 dark:text-success-400">
                          {formatSalary(job.salary)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/job/${job._id}`)}
                        className="btn-outline w-full"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {recentJobs.length > 0 && (
            <div className="card-footer">
              <button
                onClick={() => navigate('/jobs')}
                className="btn-primary w-full"
              >
                View All Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// App Content component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={user ? <MainContent /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
          <Route path="/job/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><JobPosting /></ProtectedRoute>} />
          <Route path="/ai-dashboard" element={<ProtectedRoute><AIDashboard /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletConnect /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/networking" element={<ProtectedRoute><Networking /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><PostFeed /></ProtectedRoute>} />
          <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Web3Provider>
          <Router>
            <AppContent />
          </Router>
        </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
