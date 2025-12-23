const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 3000
  },
  postType: {
    type: String,
    enum: ['update', 'career', 'document', 'article', 'achievement'],
    default: 'update'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    fileType: String,
    fileSize: Number,
    thumbnail: String,
    description: String
  }],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['general', 'technology', 'business', 'career', 'education', 'networking', 'job', 'achievement'],
    default: 'general'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search functionality
postSchema.index({ content: 'text', title: 'text', tags: 'text' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ postType: 1, category: 1 });
postSchema.index({ visibility: 1, isActive: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Method to check if user has liked the post
postSchema.methods.hasLiked = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to check if user has shared the post
postSchema.methods.hasShared = function(userId) {
  return this.shares.some(share => share.user.toString() === userId.toString());
};

// Add pagination plugin
postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', postSchema); 