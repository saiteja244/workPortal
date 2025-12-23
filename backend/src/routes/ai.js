const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  extractSkills,
  calculateJobMatch,
  getJobRecommendations,
  analyzeJobDescription,
  generateApplicationSuggestions
} = require('../utils/ai');
const Job = require('../models/Job');
const User = require('../models/User');

/**
 * @route   POST /api/ai/extract-skills
 * @desc    Extract skills from text content
 * @access  Private
 */
router.post('/extract-skills', auth, async (req, res) => {
  try {
    const { content, model = 'open-source' } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Extracting skills using model: ${model}`);
    const skills = await extractSkills(content, model);

    res.json({
      success: true,
      skills,
      count: skills.length,
      model: model
    });
  } catch (error) {
    console.error('Skill extraction error:', error);
    res.status(500).json({ 
      message: 'Failed to extract skills',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/job-match
 * @desc    Calculate job-candidate match score
 * @access  Private
 */
router.post('/job-match', auth, async (req, res) => {
  try {
    const { jobId, model = 'open-source' } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Get job and user data
    const job = await Job.findById(jobId);
    const user = await User.findById(userId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Calculating job match using model: ${model}`);
    const match = await calculateJobMatch(job, user, model);

    res.json({
      success: true,
      match,
      model: model,
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        skills: job.skills
      },
      candidate: {
        id: user._id,
        name: user.name,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Job matching error:', error);
    res.status(500).json({ 
      message: 'Failed to calculate job match',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/job-recommendations
 * @desc    Get personalized job recommendations for user
 * @access  Private
 */
router.get('/job-recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1, skills, location, type } = req.query;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build query for available jobs
    const query = { isActive: true };
    
    // Add filters if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }

    // Get available jobs (show all active jobs for recommendations)
    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    if (jobs.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalJobs: 0
        }
      });
    }

    // Get recommendations with match scores
    const recommendations = await getJobRecommendations(user, jobs, parseInt(limit));

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);

    res.json({
      success: true,
      recommendations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        hasNextPage: skip + jobs.length < totalJobs,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({ 
      message: 'Failed to get job recommendations',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/analyze-job
 * @desc    Analyze job description and extract insights
 * @access  Private
 */
router.post('/analyze-job', auth, async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    const analysis = await analyzeJobDescription(jobDescription);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Job analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze job description',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/application-suggestions
 * @desc    Generate personalized application suggestions
 * @access  Private
 */
router.post('/application-suggestions', auth, async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Get job and user data
    const job = await Job.findById(jobId);
    const user = await User.findById(userId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const suggestions = await generateApplicationSuggestions(job, user);

    res.json({
      success: true,
      suggestions,
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      }
    });
  } catch (error) {
    console.error('Application suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to generate application suggestions',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/batch-skill-extraction
 * @desc    Extract skills from multiple content pieces
 * @access  Private
 */
router.post('/batch-skill-extraction', auth, async (req, res) => {
  try {
    const { contents } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ message: 'Contents array is required' });
    }

    if (contents.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 content pieces allowed per request' });
    }

    const results = [];

    for (const content of contents) {
      try {
        const skills = await extractSkills(content.text || content);
        results.push({
          content: content.text || content,
          skills,
          count: skills.length
        });
      } catch (error) {
        results.push({
          content: content.text || content,
          skills: [],
          count: 0,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      totalProcessed: results.length
    });
  } catch (error) {
    console.error('Batch skill extraction error:', error);
    res.status(500).json({ 
      message: 'Failed to process batch skill extraction',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/match-history
 * @desc    Get user's job match history
 * @access  Private
 */
router.get('/match-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get user's applied jobs
    const user = await User.findById(userId).populate('applications');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const applications = user.applications || [];
    const skip = (page - 1) * limit;
    const paginatedApplications = applications.slice(skip, skip + parseInt(limit));

    // Calculate match scores for applied jobs
    const matchHistory = [];

    for (const application of paginatedApplications) {
      try {
        const match = await calculateJobMatch(application, user);
        matchHistory.push({
          job: {
            id: application._id,
            title: application.title,
            company: application.company,
            appliedAt: application.applications?.find(app => app.user.toString() === userId)?.appliedAt
          },
          match
        });
      } catch (error) {
        console.error('Error calculating match for job:', application._id, error);
      }
    }

    res.json({
      success: true,
      matchHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.length / limit),
        totalApplications: applications.length,
        hasNextPage: skip + paginatedApplications.length < applications.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Match history error:', error);
    res.status(500).json({ 
      message: 'Failed to get match history',
      error: error.message 
    });
  }
});

module.exports = router; 