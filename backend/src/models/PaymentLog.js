const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'ETH'
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  fromAddress: {
    type: String,
    required: true
  },
  toAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  blockNumber: {
    type: Number
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: String
  },
  network: {
    type: String,
    default: 'ethereum'
  },
  purpose: {
    type: String,
    enum: ['job-posting', 'premium-feature', 'subscription'],
    default: 'job-posting'
  }
}, {
  timestamps: true
});

// Index for transaction hash
paymentLogSchema.index({ transactionHash: 1 });

// Index for user payments
paymentLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentLog', paymentLogSchema); 