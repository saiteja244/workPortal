import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import aiAPI from '../utils/aiApi';
import { jobsAPI } from '../utils/api';

const AIDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('matching');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Job matching state
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  
  // Skill extraction state
  const [content, setContent] = useState('');
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [skillModel, setSkillModel] = useState('open-source');
  const [skillSuccess, setSkillSuccess] = useState(false);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [recommendationFilters, setRecommendationFilters] = useState({
    skills: '',
    location: '',
    type: ''
  });

  useEffect(() => {
    if (user) {
      loadAvailableJobs();
      loadJobRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAvailableJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAllJobs({ limit: 20, isActive: true });
      setAvailableJobs(response.data.jobs || []);
      
      // If no jobs available, show a message
      if (!response.data.jobs || response.data.jobs.length === 0) {
        setError('No jobs available for matching. Please create some job postings first.');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadJobRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get AI recommendations
      const aiResponse = await aiAPI.getJobRecommendations({
        limit: 10,
        skills: recommendationFilters.skills,
        location: recommendationFilters.location,
        type: recommendationFilters.type
      });
      
      setRecommendations(aiResponse.data?.recommendations || aiResponse.recommendations || []);
      
      // If no recommendations, show a helpful message
      if (!aiResponse.data?.recommendations && !aiResponse.recommendations) {
        setError('No job recommendations available. Try adjusting your filters or create some job postings first.');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Failed to load job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleJobMatch = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aiAPI.calculateJobMatch(jobId);
      setMatchAnalysis(response.match);
      setSelectedJob(response.job);
    } catch (error) {
      console.error('Error calculating job match:', error);
      setError('Failed to calculate job match');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillExtraction = async () => {
    if (!content.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSkillSuccess(false);
      
      const response = await aiAPI.extractSkills(content, skillModel);
      setExtractedSkills(response.skills || []);
      setSkillSuccess(true);
    } catch (error) {
      console.error('Error extracting skills:', error);
      setError('Failed to extract skills');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSkills = () => {
    setContent('');
    setExtractedSkills([]);
    setError(null);
    setSkillSuccess(false);
  };

  const handleCopySkills = () => {
    const skillsText = extractedSkills.join(', ');
    navigator.clipboard.writeText(skillsText).then(() => {
      const originalText = document.querySelector('.copy-button')?.textContent;
      const button = document.querySelector('.copy-button');
      if (button) {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  };

  const handleAddSkillsToProfile = async () => {
    if (!user) {
      setError('Please login to update your profile');
      return;
    }
    if (!extractedSkills.length) {
      setError('No skills to add. Please extract skills first.');
      return;
    }
    try {
      setError(null);
      setSkillSuccess(false);
      const result = await updateProfile({ skills: extractedSkills });
      if (result.success) {
        const skillsAdded = result.skillsAdded || extractedSkills.length;
        const totalSkills = result.totalSkills || extractedSkills.length;
        setSkillSuccess(`Successfully added ${skillsAdded} new skills to your profile! You now have ${totalSkills} total skills.`);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMatchScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
  };

  const tabs = [
    { id: 'matching', label: 'Job Matching', icon: '🎯' },
    { id: 'skills', label: 'Skill Extraction', icon: '🔍' },
    { id: 'recommendations', label: 'Smart Recommendations', icon: '💡' }
  ];

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Login Required</h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">Please login to access AI features</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Leverage artificial intelligence to enhance your job search and career development
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Job Matching Tab */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Job Matching</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get personalized job match scores based on your skills, experience, and preferences.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Select a Job to Analyze</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableJobs.length > 0 ? (
                    availableJobs.slice(0, 10).map((job) => (
                      <div
                        key={job._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedJob?.id === job._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => handleJobMatch(job._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{job.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{job.company}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{job.location}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {job.skills?.slice(0, 2).map((skill, index) => (
                                <span key={index} className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Click to analyze
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      {loading ? 'Loading jobs...' : 'No jobs available for matching'}
                    </div>
                  )}
                </div>
              </div>

              {/* Match Analysis */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Match Analysis</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : matchAnalysis ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Overall Match Score</h4>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {matchAnalysis.overallMatchScore}%
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Detailed Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Skill Match</span>
                          <span className={`text-sm font-medium ${getMatchScoreColor(matchAnalysis.skillMatchScore)}`}>
                            {matchAnalysis.skillMatchScore}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Experience Match</span>
                          <span className={`text-sm font-medium ${getMatchScoreColor(matchAnalysis.experienceMatchScore)}`}>
                            {matchAnalysis.experienceMatchScore}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Culture Fit</span>
                          <span className={`text-sm font-medium ${getMatchScoreColor(matchAnalysis.cultureFitScore)}`}>
                            {matchAnalysis.cultureFitScore}%
                          </span>
                        </div>
                      </div>
                      
                      {matchAnalysis.reasoning && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{matchAnalysis.reasoning}</p>
                        </div>
                      )}
                      
                      {matchAnalysis.recommendations && matchAnalysis.recommendations.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recommendations</h5>
                          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            {matchAnalysis.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Select a job to see detailed match analysis
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Extraction Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Skill Extractor</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Extract technical skills from your resume, bio, or any text content using AI
              </p>
              <div className="flex items-center justify-center space-x-4 bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                <label htmlFor="skill-model" className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Model:</label>
                <select
                  id="skill-model"
                  value={skillModel}
                  onChange={e => setSkillModel(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="open-source">Open Source (Free)</option>
                  <option value="openai">OpenAI (API Key Required)</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-500 px-2 py-1 rounded">
                  Currently using: {skillModel === 'open-source' ? 'Open Source (Free)' : 'OpenAI'}
                </span>
              </div>
            </div>

            {skillSuccess && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
                {typeof skillSuccess === 'string' ? skillSuccess : `Successfully extracted ${extractedSkills.length} skills!`}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Content to Analyze
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={16}
                    className="form-input text-sm"
                    placeholder="Paste your resume, bio, job description, or any text content here..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSkillExtraction}
                    disabled={loading || !content.trim()}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Extract Skills
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearSkills}
                    className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Example Content */}
                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-500">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">💡 Example Content:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    "Experienced React developer with 3+ years building web applications. 
                    Proficient in JavaScript, TypeScript, Node.js, and MongoDB. 
                    Worked with AWS, Docker, and CI/CD pipelines."
                  </p>
                  <button
                    onClick={() => setContent("Experienced React developer with 3+ years building web applications. Proficient in JavaScript, TypeScript, Node.js, and MongoDB. Worked with AWS, Docker, and CI/CD pipelines.")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Try this example →
                  </button>
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Extracted Skills ({extractedSkills.length})
                  </label>
                  {extractedSkills.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-500">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {extractedSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCopySkills}
                          className="copy-button flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                        >
                          <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy All Skills
                        </button>
                        <button
                          onClick={handleAddSkillsToProfile}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add to Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-8 border border-gray-200 dark:border-gray-500 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Extracted skills will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Smart Job Recommendations</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get personalized job recommendations based on your skills and preferences.
            </p>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
                <input
                  type="text"
                  value={recommendationFilters.skills}
                  onChange={(e) => setRecommendationFilters({...recommendationFilters, skills: e.target.value})}
                  className="form-input"
                  placeholder="e.g., React, Node.js"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={recommendationFilters.location}
                  onChange={(e) => setRecommendationFilters({...recommendationFilters, location: e.target.value})}
                  className="form-input"
                  placeholder="e.g., New York, Remote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
                <select
                  value={recommendationFilters.type}
                  onChange={(e) => setRecommendationFilters({...recommendationFilters, type: e.target.value})}
                  className="form-input"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={loadJobRecommendations}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-6"
            >
              {loading ? 'Loading...' : 'Get Recommendations'}
            </button>

            {/* Recommendations List */}
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map(({ job, match }) => (
                  <div key={job._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{job.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.location}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{job.description?.substring(0, 150)}...</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.skills?.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreBadge(match.overallMatchScore)}`}>
                          {match.overallMatchScore}% Match
                        </span>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          ${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {loading ? 'Loading recommendations...' : 'No recommendations available. Try adjusting your filters or get recommendations.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDashboard; 