import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../utils/api';

const Messaging = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      if (userId) {
        fetchMessages(userId);
        setSelectedConversation(userId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data.conversations);
      
      // If no userId is provided but we have conversations, select the first one
      if (!userId && response.data.conversations.length > 0) {
        const firstConversation = response.data.conversations[0];
        setSelectedConversation(firstConversation.otherUser._id);
        fetchMessages(firstConversation.otherUser._id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await messagesAPI.getMessages(recipientId);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.response?.status === 403) {
        setError('You can only message connected users');
      } else {
        setError('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await messagesAPI.sendMessage(selectedConversation, newMessage);
      setNewMessage('');
      // Refresh messages
      fetchMessages(selectedConversation);
      // Refresh conversations to update last message
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      if (err.response?.status === 403) {
        alert('You can only message connected users');
      } else {
        alert('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation.otherUser._id);
    fetchMessages(conversation.otherUser._id);
    navigate(`/messages/${conversation.otherUser._id}`);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatConversationPreview = (content) => {
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please Login</h2>
          <p className="text-gray-600 dark:text-white mb-6">You need to be logged in to access messages.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden messaging-container border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row h-[600px] lg:h-[700px]">
            {/* Conversations Sidebar */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
              </div>
              
              <div className="messaging-sidebar flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="text-gray-400 dark:text-gray-300 text-4xl mb-4">💬</div>
                    <p className="text-gray-500 dark:text-white mb-2">No conversations yet.</p>
                    <p className="text-gray-400 dark:text-gray-300 text-sm mb-4">Connect with people to start messaging</p>
                    <button
                      onClick={() => navigate('/networking')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm transition-colors"
                    >
                      Find People to Connect With
                    </button>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        selectedConversation === conversation.otherUser._id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {conversation.otherUser.profileImage ? (
                          <img
                            src={conversation.otherUser.profileImage}
                            alt={conversation.otherUser.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg text-gray-500 dark:text-gray-300 flex-shrink-0">
                            {conversation.otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conversation.otherUser.name}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-300 flex-shrink-0 ml-2">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {formatConversationPreview(conversation.lastMessage.content)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-block bg-blue-600 text-white text-xs rounded-full px-2 py-1 mt-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      {conversations.find(c => c.otherUser._id === selectedConversation)?.otherUser.profileImage ? (
                        <img
                          src={conversations.find(c => c.otherUser._id === selectedConversation).otherUser.profileImage}
                          alt={conversations.find(c => c.otherUser._id === selectedConversation).otherUser.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg text-gray-500 dark:text-gray-300 flex-shrink-0">
                          {conversations.find(c => c.otherUser._id === selectedConversation)?.otherUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {conversations.find(c => c.otherUser._id === selectedConversation)?.otherUser.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                          {conversations.find(c => c.otherUser._id === selectedConversation)?.otherUser.bio}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="messages-area flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-500 dark:text-red-400">{error}</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-white mt-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender._id === user._id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm'
                              }`}
                            >
                              <p className="text-sm break-words message-content">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex-shrink-0">
                    <form onSubmit={sendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="input-message flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        disabled={sending}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                      >
                        {sending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700">
                  <div className="text-center max-w-md">
                    <div className="text-gray-400 dark:text-gray-300 text-6xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">Welcome to Messages</h3>
                    <p className="text-gray-500 dark:text-white mb-4">Select a conversation from the sidebar to start messaging with your connections.</p>
                    {conversations.length === 0 && (
                      <button
                        onClick={() => navigate('/networking')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm transition-colors"
                      >
                        Find People to Connect With
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messaging; 