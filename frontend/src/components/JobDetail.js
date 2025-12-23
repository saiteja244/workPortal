import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../utils/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobsAPI.getJobById(id);
        setJob(response.data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setApplying(true);
      await jobsAPI.applyForJob(id, { coverLetter });
      setApplicationSuccess(true);
      setShowApplyForm(false);
      setCoverLetter('');
      // Refresh job data to update application status
      const response = await jobsAPI.getJobById(id);
      setJob(response.data.job);
    } catch (err) {
      console.error('Error applying for job:', err);
      setError('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel your application? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      await jobsAPI.cancelApplication(id);
      // Refresh job data to update application status
      const response = await jobsAPI.getJobById(id);
      setJob(response.data.job);
      setError(null);
    } catch (err) {
      console.error('Error cancelling application:', err);
      setError('Failed to cancel application');
    } finally {
      setCancelling(false);
    }
  };

  const formatSalary = (budget) => {
    if (!budget) return 'Salary not specified';
    const min = budget.min || 0;
    const max = budget.max || min;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasApplied = job?.applications?.some(app => 
    app.applicant?._id === user?._id || app.applicant === user?._id
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The job you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-4">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {job.company}
              </span>
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {formatSalary(job.budget)}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span>Posted {formatDate(job.createdAt)}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{job.type}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {user && !hasApplied && (
              <button
                onClick={() => setShowApplyForm(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Apply Now
              </button>
            )}
            {hasApplied && (
              <div className="flex flex-col space-y-2">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg text-sm">
                  ✓ Applied
                </div>
                <button
                  onClick={handleCancelApplication}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Application'}
                </button>
              </div>
            )}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Login to Apply
              </button>
            )}
          </div>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Job Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job Description</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{job.description}</p>
        </div>
      </div>

      {/* Company Info */}
      {job.employer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About the Company</h2>
          <div className="flex items-center space-x-4">
            {job.employer.profileImage ? (
              <img
                src={job.employer.profileImage}
                alt={job.employer.name || 'Company'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-300">
                {(job.employer.name && job.employer.name.charAt(0).toUpperCase()) || 'C'}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{job.employer.name || 'Company'}</h3>
              {job.employer.bio && (
                <p className="text-gray-600 dark:text-gray-300 mt-1">{job.employer.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showApplyForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Apply for this Position</h2>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {applicationSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
              Application submitted successfully!
            </div>
          )}
          <form onSubmit={handleApply}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={applying}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Back to Jobs */}
      <div className="text-center">
        <button
          onClick={() => navigate('/jobs')}
          className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          ← Back to All Jobs
        </button>
      </div>
    </div>
  );
};

export default JobDetail; 