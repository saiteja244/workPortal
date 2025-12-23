import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { jobsAPI } from '../utils/api';

const JobPosting = () => {
  const { user } = useAuth();
  const { isConnected, makePayment, walletAddress, balance } = useWeb3();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: 'Remote',
    type: 'full-time',
    skills: '',
    budgetMin: '',
    budgetMax: '',
    currency: 'USD',
    tags: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('0.001'); // Reduced to 0.001 ETH
  const [paymentStatus, setPaymentStatus] = useState(''); // 'pending', 'processing', 'confirmed', 'failed'
  const [transactionHash, setTransactionHash] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to post a job');
      return;
    }

    // Validate form
    if (!formData.title || !formData.description || !formData.company || !formData.budgetMin || !formData.budgetMax) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.budgetMin) >= parseFloat(formData.budgetMax)) {
      setError('Minimum budget must be less than maximum budget');
      return;
    }

    // Check if wallet is connected for payment
    if (!isConnected) {
      setError('Please connect your wallet to post a job');
      return;
    }

    // Check if user has sufficient balance
    const userBalance = parseFloat(balance);
    const requiredAmount = parseFloat(paymentAmount);
    if (userBalance < requiredAmount) {
      setError(`Insufficient balance. You have ${userBalance.toFixed(4)} ETH but need ${requiredAmount} ETH for the payment.`);
      return;
    }

    // Move to payment step
    setPaymentStep(true);
    setError(null);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('processing');

      // Validate payment amount
      const amount = parseFloat(paymentAmount);
      if (amount <= 0 || amount > 1) {
        throw new Error('Invalid payment amount. Must be between 0.001 and 1 ETH.');
      }

      // Make blockchain payment
      const paymentResult = await makePayment(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Platform wallet address
        paymentAmount
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error);
      }

      setTransactionHash(paymentResult.data.transactionHash);
      setPaymentStatus('confirmed');

      // Wait a moment to show confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create job with payment verification
      const jobData = {
        title: formData.title,
        description: formData.description,
        company: formData.company,
        location: formData.location,
        type: formData.type,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        budget: {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax),
          currency: formData.currency
        },
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        paymentVerified: true,
        paymentTxHash: paymentResult.data.transactionHash,
        paymentAmount: parseFloat(paymentAmount),
        walletAddress: walletAddress
      };

      // Create job posting
      const response = await jobsAPI.createJob(jobData);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        company: '',
        location: 'Remote',
        type: 'full-time',
        skills: '',
        budgetMin: '',
        budgetMax: '',
        currency: 'USD',
        tags: ''
      });

      // Redirect to job details or show success message
      setTimeout(() => {
        window.location.href = `/jobs/${response.data.job._id}`;
      }, 3000);

    } catch (error) {
      setPaymentStatus('failed');
      setError(error.message || 'Failed to process payment and post job');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setPaymentStep(false);
    setError(null);
    setPaymentStatus('');
    setTransactionHash('');
  };

  const getPaymentStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing blockchain payment...';
      case 'confirmed':
        return 'Payment confirmed! Creating job posting...';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return '';
    }
  };

  const getPaymentStatusColor = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">Login Required</h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">Please login to post a job</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Blockchain Payment Required</h2>
            <p className="text-gray-600 dark:text-gray-300">
              To post a job, you need to pay a small fee using your connected wallet.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {paymentStatus && (
            <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-3 rounded mb-6 ${getPaymentStatusColor()}`}>
              <div className="flex items-center">
                {paymentStatus === 'processing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                )}
                {paymentStatus === 'confirmed' && (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {paymentStatus === 'failed' && (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                {getPaymentStatusMessage()}
              </div>
            </div>
          )}

          {transactionHash && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
              <p className="text-sm font-medium mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono break-all">{transactionHash}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount (ETH)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.001"
                min="0.001"
                max="1"
                className="form-input"
                placeholder="0.001"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Platform fee for job posting (0.001 ETH recommended)
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-600 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Job Summary</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Title:</strong> {formData.title}</p>
                <p><strong>Company:</strong> {formData.company}</p>
                <p><strong>Budget:</strong> ${formData.budgetMin} - ${formData.budgetMax}</p>
                <p><strong>Your Balance:</strong> {parseFloat(balance).toFixed(4)} ETH</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePayment}
                disabled={loading || paymentStatus === 'processing'}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Payment...' : 'Pay & Post Job'}
              </button>
              <button
                onClick={handleBackToForm}
                disabled={loading || paymentStatus === 'processing'}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Post a New Job</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create a job posting and reach qualified candidates. Payment required via blockchain.
        </p>
        {!isConnected && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ Please connect your wallet to post a job. You'll need to pay a small fee in ETH.
            </p>
          </div>
        )}
        {isConnected && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✅ Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)} | Balance: {parseFloat(balance).toFixed(4)} ETH
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
          Job posted successfully! Redirecting to job details...
        </div>
      )}

      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="e.g., Senior React Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                placeholder="Remote, San Francisco, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-select"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Budget *
              </label>
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Budget *
              </label>
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-select"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ETH">ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="form-input"
                placeholder="React, Node.js, MongoDB (comma-separated)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="form-textarea"
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="remote, startup, blockchain (comma-separated)"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.location.href = '/jobs'}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPosting; 