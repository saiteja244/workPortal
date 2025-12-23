const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all posts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category,
      postType,
      author,
      featured
    } = req.query;

    const query = { isActive: true };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by post type
    if (postType) {
      query.postType = postType;
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Filter featured posts
    if (featured === 'true') {
      query.featured = true;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'author',
          select: 'name email profileImage bio'
        },
        {
          path: 'comments.user',
          select: 'name profileImage'
        },
        {
          path: 'likes.user',
          select: 'name profileImage'
        },
        {
          path: 'shares.user',
          select: 'name profileImage'
        }
      ]
    };

    const posts = await Post.paginate(query, options);

    // Add like/comment/share counts and user interaction status
    const postsWithStats = posts.docs.map(post => {
      const postObj = post.toObject();
      postObj.likeCount = post.likes.length;
      postObj.commentCount = post.comments.length;
      postObj.shareCount = post.shares.length;
      return postObj;
    });

    res.json({
      posts: postsWithStats,
      pagination: {
        currentPage: posts.page,
        totalPages: posts.totalPages,
        totalDocs: posts.totalDocs,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profileImage bio')
      .populate('likes.user', 'name profileImage')
      .populate('comments.user', 'name profileImage')
      .populate('shares.user', 'name profileImage');

    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postObj = post.toObject();
    postObj.likeCount = post.likes.length;
    postObj.commentCount = post.comments.length;
    postObj.shareCount = post.shares.length;

    res.json({ post: postObj });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new post
router.post('/', auth, async (req, res) => {
  try {
    const {
      content,
      postType,
      title,
      tags,
      attachments,
      visibility,
      category
    } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ 
        message: 'Content is required' 
      });
    }

    const post = new Post({
      author: req.user._id,
      content,
      postType: postType || 'update',
      title,
      tags: tags || [],
      attachments: attachments || [],
      visibility: visibility || 'public',
      category: category || 'general'
    });

    await post.save();

    // Populate author field for response
    await post.populate('author', 'name email profileImage bio');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email profileImage bio');

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = post.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      post.likes.push({ user: req.user._id });
    }

    await post.save();

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likeCount: post.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/:id/comment', auth, async (req, res) => {
  try {
    console.log('Comment request received:', { 
      postId: req.params.id, 
      body: req.body, 
      user: req.user._id,
      headers: req.headers,
      method: req.method,
      url: req.url
    });
    
    const { content } = req.body;

    if (!content) {
      console.log('No content provided in request body');
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      console.log('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Found post:', { postId: post._id, currentComments: post.comments.length });

    post.comments.push({
      user: req.user._id,
      content
    });

    await post.save();

    console.log('Comment saved, total comments:', post.comments.length);

    // Populate the new comment's user info
    await post.populate('comments.user', 'name profileImage');

    const newComment = post.comments[post.comments.length - 1];

    console.log('New comment created:', { commentId: newComment._id, content: newComment.content });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike comment
router.post('/:postId/comment/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingLike = comment.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      comment.likes = comment.likes.filter(
        like => like.user.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      comment.likes.push({ user: req.user._id });
    }

    await post.save();

    res.json({
      message: existingLike ? 'Comment unliked' : 'Comment liked',
      likeCount: comment.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share post
router.post('/:id/share', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingShare = post.shares.find(
      share => share.user.toString() === req.user._id.toString()
    );

    if (existingShare) {
      return res.status(400).json({ message: 'Post already shared' });
    }

    post.shares.push({ user: req.user._id });
    await post.save();

    res.json({
      message: 'Post shared successfully',
      shareCount: post.shares.length
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { 
      author: req.params.userId,
      isActive: true 
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'author',
        select: 'name email profileImage bio'
      }
    };

    const posts = await Post.paginate(query, options);

    const postsWithStats = posts.docs.map(post => {
      const postObj = post.toObject();
      postObj.likeCount = post.likes.length;
      postObj.commentCount = post.comments.length;
      postObj.shareCount = post.shares.length;
      return postObj;
    });

    res.json({
      posts: postsWithStats,
      pagination: {
        currentPage: posts.page,
        totalPages: posts.totalPages,
        totalDocs: posts.totalDocs,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending posts
router.get('/trending/feed', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const posts = await Post.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 1] },
              { $multiply: [{ $size: '$comments' }, 2] },
              { $multiply: [{ $size: '$shares' }, 3] }
            ]
          }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          'author.password': 0,
          'author.__v': 0
        }
      }
    ]);

    res.json({ posts });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 