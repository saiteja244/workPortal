const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique connections between users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Virtual for checking if connection is active
connectionSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

// Method to get the other user in the connection
connectionSchema.methods.getOtherUser = function(userId) {
  return this.requester.toString() === userId.toString() ? this.recipient : this.requester;
};

module.exports = mongoose.model('Connection', connectionSchema); 