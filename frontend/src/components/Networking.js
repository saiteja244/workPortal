import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectionsAPI, jobsAPI } from '../utils/api';

const Networking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connections');
  const [error, setError] = useState(null);
  
  // Job applications state
  const [jobApplications, setJobApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingConnections();
      fetchJobApplications();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionsAPI.getConnections();
      setConnections(response.data.connections);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingConnections = async () => {
    try {
      const response = await connectionsAPI.getPendingConnections();
      setPendingConnections(response.data.connections);
    } catch (err) {
      console.error('Error fetching pending connections:', err);
    }
  };

  const fetchJobApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await jobsAPI.getMyJobApplications();
      setJobApplications(response.data.jobs || []);
    } catch (err) {
      console.error('Error fetching job applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await connectionsAPI.searchUsers(query);
      setSearchResults(response.data.users);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendConnectionRequest = async (recipientId, message = '') => {
    try {
      await connectionsAPI.sendConnectionRequest(recipientId, message);
      // Update search results to show pending status
      setSearchResults(prev => 
        prev.map(user => 
          user._id === recipientId 
            ? { ...user, connectionStatus: 'pending' }
            : user
        )
      );
    } catch (err) {
      console.error('Error sending connection request:', err);
      alert('Failed to send connection request');
    }
  };

  const acceptConnection = async (connectionId) => {
    try {
      await connectionsAPI.acceptConnection(connectionId);
      fetchConnections();
      fetchPendingConnections();
    } catch (err) {
      console.error('Error accepting connection:', err);
      alert('Failed to accept connection');
    }
  };

  const rejectConnection = async (connectionId) => {
    try {
      await connectionsAPI.rejectConnection(connectionId);
      fetchPendingConnections();
    } catch (err) {
      console.error('Error rejecting connection:', err);
      alert('Failed to reject connection');
    }
  };

  const removeConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await connectionsAPI.removeConnection(connectionId);
      fetchConnections();
    } catch (err) {
      console.error('Error removing connection:', err);
      alert('Failed to remove connection');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers(searchQuery);
  };

  const getConnectionStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      accepted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    };
    return badges[status] || 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
  };

  const getConnectionButton = (user) => {
    if (!user.connectionStatus) {
      return (
        <button
          onClick={() => sendConnectionRequest(user._id)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          Connect
        </button>
      );
    }

    if (user.connectionStatus === 'pending') {
      return (
        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs">
          Pending
        </span>
      );
    }

    if (user.connectionStatus === 'accepted') {
      return (
        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs">
          Connected
        </span>
      );
    }

    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading networking features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Networking</h1>
        <p className="text-gray-600 dark:text-gray-300">Connect with professionals and build your network</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            Pending Requests ({pendingConnections.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            Job Applications ({jobApplications.reduce((total, job) => total + job.totalApplications, 0)})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            Find People
          </button>
        </nav>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {connections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">You haven't connected with anyone yet.</p>
              <button
                onClick={() => setActiveTab('search')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Find People to Connect With
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <div key={connection._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4 mb-4">
                    {connection.otherUser.profileImage ? (
                      <img
                        src={connection.otherUser.profileImage}
                        alt={connection.otherUser.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-300">
                        {connection.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{connection.otherUser.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{connection.otherUser.email}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusBadge(connection.status)}`}>
                        {connection.status}
                      </span>
                    </div>
                  </div>

                  {connection.otherUser.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{connection.otherUser.bio}</p>
                  )}

                  {connection.otherUser.skills && connection.otherUser.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {connection.otherUser.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {connection.otherUser.skills.length > 3 && (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            +{connection.otherUser.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/messages/${connection.otherUser._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => removeConnection(connection._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingConnections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No pending connection requests.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingConnections.map((connection) => (
                <div key={connection._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4 mb-4">
                    {connection.requester.profileImage ? (
                      <img
                        src={connection.requester.profileImage}
                        alt={connection.requester.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-300">
                        {connection.requester.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{connection.requester.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{connection.requester.email}</p>
                      {connection.message && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 italic">"{connection.message}"</p>
                      )}
                    </div>
                  </div>

                  {connection.requester.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{connection.requester.bio}</p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => acceptConnection(connection._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectConnection(connection._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Applications Tab */}
      {activeTab === 'applications' && (
        <div>
          {applicationsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading job applications...</p>
            </div>
          ) : jobApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">You haven't posted any jobs yet.</p>
              <button
                onClick={() => navigate('/post-job')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Post a Job
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {jobApplications.map((job) => (
                <div key={job._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.isActive 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{job.company} • {job.location} • {job.type}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Posted on {formatDate(job.createdAt)}</p>
                    <div className="mt-3">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {job.totalApplications} Application{job.totalApplications !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {job.applications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No applications yet for this job.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Applications</h4>
                      {job.applications.map((application, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-start space-x-4">
                            {application.applicant.profileImage ? (
                              <img
                                src={application.applicant.profileImage}
                                alt={application.applicant.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg text-gray-500 dark:text-gray-300">
                                {application.applicant.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">{application.applicant.name}</h5>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{application.applicant.email}</p>
                              {application.applicant.bio && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{application.applicant.bio}</p>
                              )}
                              {application.applicant.skills && application.applicant.skills.length > 0 && (
                                <div className="mt-3">
                                  <div className="flex flex-wrap gap-1">
                                    {application.applicant.skills.slice(0, 5).map((skill, skillIndex) => (
                                      <span
                                        key={skillIndex}
                                        className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {application.applicant.skills.length > 5 && (
                                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        +{application.applicant.skills.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="mt-3">
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cover Letter:</h6>
                                <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-600 p-3 rounded">
                                  {application.coverLetter}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <button
                              onClick={() => sendConnectionRequest(application.applicant._id, `Hi ${application.applicant.name}, I saw your application for the ${job.title} position and would like to connect!`)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                            >
                              Connect & Message
                            </button>
                            <button
                              onClick={() => navigate(`/messages/${application.applicant._id}`)}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                            >
                              Direct Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex space-x-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, skills, or bio..."
                className="form-input flex-1"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((user) => (
                <div key={user._id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4 mb-4">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl text-gray-500 dark:text-gray-300">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>

                  {user.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{user.bio}</p>
                  )}

                  {user.skills && user.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {user.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            +{user.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    {getConnectionButton(user)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No users found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Networking; 