import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../utils/api';
import JobCard from './JobCard';

const JobList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    location: '',
    type: '',
    minSalary: '',
    maxSalary: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchJobs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        ...filters
      };

      const response = await jobsAPI.getAllJobs(params);
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to fetch jobs. Please try again.');
      console.error('Fetch jobs error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchJobs(1);
  };

  const handlePageChange = (page) => {
    fetchJobs(page);
  };

  const handleApply = async (jobId) => {
    try {
      await jobsAPI.applyForJob(jobId, { 
        coverLetter: 'I am interested in this position and would like to be considered for the role. I believe my skills and experience would be a great fit for this opportunity.' 
      });
      // Refresh jobs to update application status
      fetchJobs(pagination.currentPage);
    } catch (err) {
      alert('Failed to apply for job. Please try again.');
    }
  };

  const handleCancelApplication = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel your application? This action cannot be undone.')) {
      return;
    }

    try {
      await jobsAPI.cancelApplication(jobId);
      // Refresh jobs to update application status
      fetchJobs(pagination.currentPage);
    } catch (err) {
      alert('Failed to cancel application. Please try again.');
    }
  };

  const handleViewDetails = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      skills: '',
      location: '',
      type: '',
      minSalary: '',
      maxSalary: ''
    });
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-responsive py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="spinner w-12 h-12 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find your next career opportunity from thousands of job postings
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Search & Filter
              </h2>
              <button
                onClick={clearFilters}
                className="btn-ghost text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Job title, company, or keywords"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <input
                  type="text"
                  name="skills"
                  value={filters.skills}
                  onChange={handleFilterChange}
                  placeholder="React, Node.js, Python"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="City, State, or Remote"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Salary
                </label>
                <input
                  type="number"
                  name="minSalary"
                  value={filters.minSalary}
                  onChange={handleFilterChange}
                  placeholder="50000"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Salary
                </label>
                <input
                  type="number"
                  name="maxSalary"
                  value={filters.maxSalary}
                  onChange={handleFilterChange}
                  placeholder="100000"
                  className="input"
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {pagination.totalDocs > 0 ? `${pagination.totalDocs} jobs found` : 'No jobs found'}
              </h3>
              {pagination.totalDocs > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </p>
              )}
            </div>
            
            {loading && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <div className="spinner w-4 h-4 mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Jobs grid */}
          {jobs.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onApply={handleApply}
                  onViewDetails={handleViewDetails}
                  onCancelApplication={handleCancelApplication}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      page === pagination.currentPage
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobList; 