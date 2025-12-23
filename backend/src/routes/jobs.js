const express = require('express');
const Job = require('../models/Job');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all jobs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      skills, 
      location, 
      type,
      minSalary,
      maxSalary 
    } = req.query;

    const query = { isActive: true };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by job type
    if (type) {
      query.type = type;
    }

    // Filter by salary range
    if (minSalary || maxSalary) {
      query.budget = {};
      if (minSalary) query.budget.min = { $gte: parseInt(minSalary) };
      if (maxSalary) query.budget.max = { $lte: parseInt(maxSalary) };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'employer',
        select: 'name profileImage'
      }
    };

    const jobs = await Job.paginate(query, options);

    res.json({
      jobs: jobs.docs,
      pagination: {
        currentPage: jobs.page,
        totalPages: jobs.totalPages,
        totalDocs: jobs.totalDocs,
        hasNextPage: jobs.hasNextPage,
        hasPrevPage: jobs.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name profileImage bio')
      .populate('applications.applicant', 'name profileImage');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new job posting
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      company,
      location,
      type,
      skills,
      budget,
      tags,
      paymentVerified,
      paymentTxHash,
      paymentAmount,
      walletAddress,
      blockchainJobId
    } = req.body;

    // Validate required fields
    if (!title || !description || !company || !budget) {
      return res.status(400).json({ 
        message: 'Title, description, company, and budget are required' 
      });
    }

    // For production, verify blockchain payment
    if (!paymentVerified && !paymentTxHash) {
      return res.status(400).json({ 
        message: 'Payment verification required for job posting' 
      });
    }

    const job = new Job({
      title,
      description,
      company,
      location: location || 'Remote',
      type: type || 'full-time',
      skills: skills || [],
      budget,
      employer: req.user._id,
      tags: tags || [],
      paymentVerified: paymentVerified || false,
      paymentTxHash: paymentTxHash || '',
      paymentAmount: paymentAmount || 0,
      walletAddress: walletAddress || '',
      blockchainJobId: blockchainJobId || null
    });

    await job.save();

    // Populate employer field for response
    await job.populate('employer', 'name profileImage');

    res.status(201).json({
      message: 'Job posted successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'name profileImage');

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for a job
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.isActive) {
      return res.status(400).json({ message: 'This job is no longer active' });
    }

    // Check if user already applied
    const alreadyApplied = job.applications.find(
      app => app.applicant.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Validate cover letter
    if (!coverLetter || coverLetter.trim() === '') {
      return res.status(400).json({ message: 'Cover letter is required' });
    }

    // Use findByIdAndUpdate to only update the applications array
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          applications: {
            applicant: req.user._id,
            coverLetter: coverLetter.trim()
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs posted by current user
router.get('/user/my-jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('applications.applicant', 'name profileImage');

    res.json({ jobs });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs applied by current user
router.get('/user/applications', auth, async (req, res) => {
  try {
    const jobs = await Job.find({
      'applications.applicant': req.user._id
    })
    .populate('employer', 'name profileImage')
    .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel job application
router.delete('/:id/apply', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has applied for this job
    const applicationIndex = job.applications.findIndex(
      app => app.applicant.toString() === req.user._id.toString()
    );

    if (applicationIndex === -1) {
      return res.status(400).json({ message: 'You have not applied for this job' });
    }

    // Use findByIdAndUpdate to only update the applications array without triggering full validation
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          applications: {
            applicant: req.user._id
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Application cancelled successfully' });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for jobs posted by current user (for recruiters)
router.get('/user/my-job-applications', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .populate('applications.applicant', 'name email profileImage bio skills')
      .sort({ createdAt: -1 });

    // Format the response to show jobs with their applications
    const jobsWithApplications = jobs.map(job => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      isActive: job.isActive,
      createdAt: job.createdAt,
      applications: job.applications,
      totalApplications: job.applications.length
    }));

    res.json({ jobs: jobsWithApplications });
  } catch (error) {
    console.error('Get my job applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 