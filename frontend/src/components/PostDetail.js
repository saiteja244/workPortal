import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../utils/api';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(id);
      setPost(response.data.post);
      setError(null);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Post not found or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await postsAPI.likePost(id);
      // Update the post in the state
      setPost(prev => ({
        ...prev,
        likes: prev.likes.some(like => like.user === user._id)
          ? prev.likes.filter(like => like.user !== user._id)
          : [...prev.likes, { user: user._id }],
        likeCount: prev.likes.some(like => like.user === user._id)
          ? prev.likeCount - 1
          : prev.likeCount + 1
      }));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleShare = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await postsAPI.sharePost(id);
      // Update the post in the state
      setPost(prev => ({
        ...prev,
        shares: [...prev.shares, { user: user._id }],
        shareCount: prev.shareCount + 1
      }));
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!comment.trim()) return;

    try {
      console.log('Submitting comment in PostDetail:', { postId: id, comment });
      setSubmittingComment(true);
      const response = await postsAPI.addComment(id, { content: comment });
      
      console.log('Comment response in PostDetail:', response);
      
      // Add the new comment to the post
      setPost(prev => ({
        ...prev,
        comments: [...prev.comments, response.data.comment],
        commentCount: prev.commentCount + 1
      }));
      
      setComment('');
    } catch (err) {
      console.error('Error adding comment in PostDetail:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await postsAPI.likeComment(id, commentId);
      // Update the comment in the state
      setPost(prev => ({
        ...prev,
        comments: prev.comments.map(c => {
          if (c._id === commentId) {
            const isLiked = c.likes.some(like => like.user === user._id);
            return {
              ...c,
              likes: isLiked
                ? c.likes.filter(like => like.user !== user._id)
                : [...c.likes, { user: user._id }]
            };
          }
          return c;
        })
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The post you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/feed')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/feed')}
        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
      >
        ← Back to Feed
      </button>

      {/* Post */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>
        )}
        <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap text-lg">{post.content}</p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-sm px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-6">
            {post.attachments.map((attachment, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-3">
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.description || 'Attachment'}
                    className="w-full max-h-96 object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">📎</div>
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
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
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
              onClick={handleLike}
              className={`flex items-center space-x-2 text-sm ${
                post.likes.some(like => like.user === user?._id)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className="text-lg">👍</span>
              <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
              <span className="text-lg">💬</span>
              <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 text-sm"
            >
              <span className="text-lg">🔄</span>
              <span>{post.shareCount} {post.shareCount === 1 ? 'share' : 'shares'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Comments ({post.commentCount})</h2>

        {/* Add Comment */}
        {user && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex space-x-3">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="form-textarea"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-100 dark:border-gray-600 pb-4 last:border-b-0">
                <div className="flex space-x-3">
                  {comment.user.profileImage ? (
                    <img
                      src={comment.user.profileImage}
                      alt={comment.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-300">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{comment.user.name}</h4>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleCommentLike(comment._id)}
                        className={`flex items-center space-x-1 text-xs ${
                          comment.likes.some(like => like.user === user?._id)
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <span>👍</span>
                        <span>{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail; 