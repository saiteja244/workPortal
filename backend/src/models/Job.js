const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: 'Remote'
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    default: 'full-time'
  },
  skills: [{
    type: String,
    trim: true
  }],
  budget: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coverLetter: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Blockchain payment fields
  paymentVerified: {
    type: Boolean,
    default: false
  },
  paymentTxHash: {
    type: String,
    trim: true
  },
  paymentAmount: {
    type: Number
  },
  walletAddress: {
    type: String,
    trim: true
  },
  blockchainJobId: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
jobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });
jobSchema.index({ employer: 1, createdAt: -1 });
jobSchema.index({ paymentVerified: 1, isActive: 1 });

// Add pagination plugin
jobSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Job', jobSchema); 