import React from 'react';
import { useAuth } from '../context/AuthContext';

const JobCard = ({ job, onApply, onViewDetails, onCancelApplication }) => {
  const { user } = useAuth();

  const formatSalary = (min, max, currency = 'USD') => {
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}k`;
      }
      return `$${num}`;
    };
    return `${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const getJobTypeColor = (type) => {
    const colors = {
      'full-time': 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
      'part-time': 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
      'contract': 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200',
      'freelance': 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
      'internship': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const hasApplied = job.applications?.some(app => 
    app.applicant === user?._id || app.applicant._id === user?._id
  );

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

  return (
    <div className="card group hover:scale-[1.02] transition-all duration-300">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 
              className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors line-clamp-2" 
              onClick={() => onViewDetails(job._id)}
            >
              {job.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">{job.company}</p>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3 flex-wrap gap-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </div>
              <span className={`badge ${getJobTypeColor(job.type)}`}>
                {job.type.replace('-', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-lg font-bold text-success-600 dark:text-success-400">
              {formatSalary(job.budget.min, job.budget.max, job.budget.currency)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{job.budget.currency}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
          {job.description.length > 150 
            ? `${job.description.substring(0, 150)}...` 
            : job.description
          }
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 5).map((skill, index) => (
                <span
                  key={index}
                  className="badge badge-primary"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 5 && (
                <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1">
                  +{job.skills.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Posted by and date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              {job.employer?.profileImage ? (
                <img
                  src={job.employer.profileImage}
                  alt={job.employer.name}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    {job.employer?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              <span>Posted by {job.employer?.name || 'Anonymous'}</span>
            </div>
            <span className="mx-2">•</span>
            <span>{formatDate(job.createdAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => onViewDetails(job._id)}
            className="btn-ghost text-sm"
          >
            View Details
          </button>
          
          <div className="flex gap-2">
            {user && !hasApplied && job.isActive && (
              <button
                onClick={() => onApply(job._id)}
                className="btn-primary text-sm"
              >
                Apply Now
              </button>
            )}
            
            {hasApplied && (
              <div className="flex items-center gap-2">
                <span className="badge badge-success">
                  Applied
                </span>
                <button
                  onClick={() => onCancelApplication(job._id)}
                  className="btn-danger text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-1">
              {job.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard; 