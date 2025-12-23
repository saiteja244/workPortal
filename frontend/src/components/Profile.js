import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { walletAddress, isConnected, connectWallet, isConnecting } = useWeb3();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    linkedinUrl: '',
    walletAddress: '',
    profileImage: '',
    skills: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        linkedinUrl: user.linkedinUrl || '',
        walletAddress: user.walletAddress || '',
        profileImage: user.profileImage || '',
        skills: user.skills || [],
      });
    }
  }, [user]);

  // Update wallet address when Web3 wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      setForm(prev => ({
        ...prev,
        walletAddress: walletAddress
      }));
    }
  }, [isConnected, walletAddress]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (idx, value) => {
    const newSkills = [...form.skills];
    newSkills[idx] = value;
    setForm({ ...form, skills: newSkills });
  };

  const handleAddSkill = () => {
    setForm({ ...form, skills: [...form.skills, ''] });
  };

  const handleRemoveSkill = (idx) => {
    const newSkills = form.skills.filter((_, i) => i !== idx);
    setForm({ ...form, skills: newSkills });
  };

  const handleWalletConnect = async () => {
    try {
      const result = await connectWallet();
      if (result.success) {
        setSuccess('Wallet connected successfully!');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to connect wallet');
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    const result = await updateProfile(form);
    if (result.success) {
      setSuccess(true);
      setEditMode(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-gray-700 rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Profile</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Please login to view your profile.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-gray-700 rounded shadow">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">My Profile</h2>
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-2 rounded mb-4">{success}</div>}
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {form.profileImage ? (
            <img src={form.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-3xl text-gray-500 dark:text-gray-300">👤</div>
          )}
          <div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{form.name}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={!editMode}
            className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            disabled={!editMode}
            rows={3}
            className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn URL</label>
          <input
            type="text"
            name="linkedinUrl"
            value={form.linkedinUrl}
            onChange={handleChange}
            disabled={!editMode}
            className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Address</label>
          <div className="flex space-x-2">
            <input
              type="text"
              name="walletAddress"
              value={form.walletAddress}
              onChange={handleChange}
              disabled={!editMode}
              className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600 flex-1"
              placeholder="Connect wallet to auto-fill"
            />
            {editMode && (
              <button
                type="button"
                onClick={handleWalletConnect}
                disabled={isConnecting || isConnected}
                className={`mt-1 px-4 py-2 rounded text-sm font-medium ${
                  isConnected 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            )}
          </div>
          {isConnected && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✓ Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Image URL</label>
          <input
            type="text"
            name="profileImage"
            value={form.profileImage}
            onChange={handleChange}
            disabled={!editMode}
            className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
          <div className="space-y-2">
            {form.skills.map((skill, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={skill}
                  onChange={e => handleSkillChange(idx, e.target.value)}
                  disabled={!editMode}
                  className="form-input mt-1 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
                {editMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {editMode && (
              <button
                type="button"
                onClick={handleAddSkill}
                className="mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                Add Skill
              </button>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => { setEditMode(false); setError(null); setSuccess(false); }}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 