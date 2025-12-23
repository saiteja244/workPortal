import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../utils/api';

const PostFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({}); // Store comments for each post
  const [submittingComments, setSubmittingComments] = useState({}); // Track submitting state for each post
  const [showCommentInputs, setShowCommentInputs] = useState({}); // Track which posts show comment input
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    category: '',
    postType: '',
    search: ''
  });

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...filters
      };
      const response = await postsAPI.getPosts(params);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postsAPI.likePost(postId);
      // Update the post in the list
      setPosts(prev => 
        prev.map(post => {
          if (post._id === postId) {
            const isLiked = post.likes.some(like => like.user === user._id);
            return {
              ...post,
              likes: isLiked 
                ? post.likes.filter(like => like.user !== user._id)
                : [...post.likes, { user: user._id }],
              likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleShare = async (postId) => {
    try {
      await postsAPI.sharePost(postId);
      // Update the post in the list
      setPosts(prev => 
        prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              shares: [...post.shares, { user: user._id }],
              shareCount: post.shareCount + 1
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const toggleCommentInput = (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowCommentInputs(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId, value) => {
    console.log('Comment change:', { postId, value });
    setComments(prev => {
      const newState = {
        ...prev,
        [postId]: value
      };
      console.log('New comments state:', newState);
      return newState;
    });
  };

  const handleSubmitComment = async (postId) => {
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    const commentText = comments[postId];
    console.log('Comment text:', commentText);
    console.log('Comments state:', comments);
    
    if (!commentText || !commentText.trim()) {
      console.log('No comment text provided');
      return;
    }

    try {
      console.log('Submitting comment:', { postId, commentText, user: user._id });
      console.log('Token:', localStorage.getItem('token'));
      
      const commentData = { content: commentText };
      console.log('Comment data being sent:', commentData);
      console.log('Comment data type:', typeof commentData);
      console.log('Comment data JSON:', JSON.stringify(commentData));
      
      setSubmittingComments(prev => ({ ...prev, [postId]: true }));
      const response = await postsAPI.addComment(postId, commentData);
      
      console.log('Comment response:', response);
      
      // Update the post with new comment
      setPosts(prev => 
        prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...post.comments, response.data.comment],
              commentCount: post.commentCount + 1
            };
          }
          return post;
        })
      );
      
      // Clear comment input and hide it
      setComments(prev => ({ ...prev, [postId]: '' }));
      setShowCommentInputs(prev => ({ ...prev, [postId]: false }));
    } catch (err) {
      console.error('Error adding comment:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
    } finally {
      setSubmittingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPostTypeIcon = (postType) => {
    const icons = {
      update: '📝',
      career: '💼',
      document: '📄',
      article: '📰',
      achievement: '🏆'
    };
    return icons[postType] || '📝';
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200',
      technology: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      business: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      career: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      education: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      networking: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
      job: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      achievement: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
  };

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Professional Feed</h1>
            <p className="text-gray-600 dark:text-gray-300">Stay updated with career insights, achievements, and professional content</p>
          </div>
          {user && (
            <button
              onClick={() => navigate('/create-post')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="career">Career</option>
              <option value="education">Education</option>
              <option value="networking">Networking</option>
              <option value="job">Job</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Post Type</label>
            <select
              name="postType"
              value={filters.postType}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="update">Update</option>
              <option value="career">Career</option>
              <option value="document">Document</option>
              <option value="article">Article</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search posts..."
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No posts found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your filters or be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
              {/* Post Header */}
              <div className="flex items-start space-x-3 mb-4">
                {post.author.profileImage ? (
                  <img
                    src={post.author.profileImage}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg text-gray-500 dark:text-gray-300">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{post.author.name}</h3>
                    <span className="text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{formatTime(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getPostTypeIcon(post.postType)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm capitalize">{post.postType}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              {post.title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{post.title}</h2>
              )}
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="mb-4">
                  {post.attachments.map((attachment, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-2">
                      {attachment.type === 'image' ? (
                        <img
                          src={attachment.url}
                          alt={attachment.description || 'Attachment'}
                          className="w-full h-48 object-cover rounded"
                        />
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">📎</div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{attachment.filename || 'Document'}</p>
                            {attachment.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{attachment.description}</p>
                            )}
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          >
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 text-sm ${
                      post.likes.some(like => like.user === user?._id)
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <span className="text-lg">👍</span>
                    <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
                  </button>
                  
                  <button
                    onClick={() => toggleCommentInput(post._id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                  >
                    <span className="text-lg">💬</span>
                    <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm"
                  >
                    <span className="text-lg">🔄</span>
                    <span>{post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => navigate(`/post/${post._id}`)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>

              {/* Comment Input */}
              {showCommentInputs[post._id] && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-3">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={comments[post._id] || ''}
                        onChange={(e) => handleCommentChange(post._id, e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setShowCommentInputs(prev => ({ ...prev, [post._id]: false }))}
                          className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitComment(post._id)}
                          disabled={submittingComments[post._id] || !comments[post._id]?.trim()}
                          className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComments[post._id] ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Comments Preview */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-3">
                    {post.comments.slice(-2).map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        {comment.user.profileImage ? (
                          <img
                            src={comment.user.profileImage}
                            alt={comment.user.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-300">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{comment.user.name}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{formatTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {post.commentCount > 2 && (
                      <button
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                      >
                        View all {post.commentCount} comments →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => fetchPosts(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchPosts(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PostFeed; 