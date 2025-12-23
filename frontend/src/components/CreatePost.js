import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../utils/api';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    postType: 'update',
    title: '',
    tags: '',
    category: 'general',
    visibility: 'public'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment = {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: e.target.result,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          description: ''
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const postData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        attachments
      };

      await postsAPI.createPost(postData);
      
      // Redirect to feed
      navigate('/feed');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeDescription = (type) => {
    const descriptions = {
      update: 'Share a general update about your professional life',
      career: 'Share career advice, tips, or experiences',
      document: 'Share a useful document, resume, or resource',
      article: 'Share an article or detailed professional content',
      achievement: 'Celebrate a professional achievement or milestone'
    };
    return descriptions[type] || descriptions.update;
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      general: 'General professional content',
      technology: 'Tech-related posts and insights',
      business: 'Business and entrepreneurship content',
      career: 'Career development and advice',
      education: 'Educational content and learning',
      networking: 'Networking tips and experiences',
      job: 'Job-related content and opportunities',
      achievement: 'Professional achievements and milestones'
    };
    return descriptions[category] || descriptions.general;
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Login</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to create posts.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create a Post</h1>
        <p className="text-gray-600 dark:text-gray-300">Share your professional insights, achievements, or useful content with your network</p>
      </div>

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="form-label">
              Post Type
            </label>
            <select
              name="postType"
              value={formData.postType}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="update">📝 Update</option>
              <option value="career">💼 Career</option>
              <option value="document">📄 Document</option>
              <option value="article">📰 Article</option>
              <option value="achievement">🏆 Achievement</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getPostTypeDescription(formData.postType)}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="career">Career</option>
              <option value="education">Education</option>
              <option value="networking">Networking</option>
              <option value="job">Job</option>
              <option value="achievement">Achievement</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {getCategoryDescription(formData.category)}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="form-label">
              Title (Optional)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a title for your post..."
              maxLength={200}
              className="form-input"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="form-label">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              placeholder="Share your thoughts, insights, or professional content..."
              maxLength={3000}
              required
              className="form-textarea"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.content.length}/3000 characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">
              Tags (Optional)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., career, technology, networking)"
              className="form-input"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tags help others discover your content
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="form-label">
              Attachments (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="form-file"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload images, documents, or other files (max 5 files)
            </p>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Attachments ({attachments.length})</h4>
              <div className="space-y-3">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">
                      {attachment.type === 'image' ? '🖼️' : '📎'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{attachment.filename}</p>
                      <p className="text-sm text-gray-500">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="form-label">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="public">🌐 Public - Anyone can see</option>
              <option value="connections">👥 Connections - Only your connections can see</option>
              <option value="private">🔒 Private - Only you can see</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.content.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 