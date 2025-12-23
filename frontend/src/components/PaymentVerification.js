import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

const PaymentVerification = ({ transactionHash, onVerificationComplete }) => {
  const { provider } = useWeb3();
  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'verifying', 'confirmed', 'failed'
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transactionHash) {
      verifyTransaction();
    }
  }, [transactionHash]);

  const verifyTransaction = async () => {
    try {
      setVerificationStatus('verifying');
      setError(null);

      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        throw new Error('Transaction not found on blockchain');
      }

      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction failed on blockchain');
      }

      // Get transaction details
      const transaction = await provider.getTransaction(transactionHash);
      
      setTransactionDetails({
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        from: transaction.from,
        to: transaction.to,
        value: transaction.value.toString(),
        confirmations: receipt.confirmations
      });

      setVerificationStatus('confirmed');
      
      // Notify parent component
      if (onVerificationComplete) {
        onVerificationComplete({
          success: true,
          transactionHash,
          receipt,
          transaction
        });
      }

    } catch (error) {
      console.error('Transaction verification error:', error);
      setError(error.message);
      setVerificationStatus('failed');
      
      if (onVerificationComplete) {
        onVerificationComplete({
          success: false,
          error: error.message
        });
      }
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'pending':
        return 'Waiting for transaction...';
      case 'verifying':
        return 'Verifying transaction on blockchain...';
      case 'confirmed':
        return 'Transaction confirmed on blockchain!';
      case 'failed':
        return 'Transaction verification failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'verifying':
        return 'text-blue-600 dark:text-blue-400';
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatEther = (wei) => {
    return (parseInt(wei) / 1e18).toFixed(6);
  };

  const getExplorerUrl = () => {
    const network = provider?.network;
    if (!network) return null;
    
    const chainId = network.chainId;
    const explorers = {
      1: 'https://etherscan.io',
      5: 'https://goerli.etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com'
    };
    
    return explorers[chainId] ? `${explorers[chainId]}/tx/${transactionHash}` : null;
  };

  if (!transactionHash) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Payment Verification
        </h3>
        <div className={`flex items-center ${getStatusColor()}`}>
          {verificationStatus === 'verifying' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          )}
          {verificationStatus === 'confirmed' && (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {verificationStatus === 'failed' && (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction Hash:</p>
          <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
            {transactionHash}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {transactionDetails && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Block:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{transactionDetails.blockNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Confirmations:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{transactionDetails.confirmations}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{formatEther(transactionDetails.value)} ETH</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Gas Used:</span>
                <span className="ml-1 text-gray-900 dark:text-white">{transactionDetails.gasUsed}</span>
              </div>
            </div>
          </div>
        )}

        {getExplorerUrl() && (
          <div className="pt-2">
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
            >
              View on Blockchain Explorer →
            </a>
          </div>
        )}

        {verificationStatus === 'failed' && (
          <button
            onClick={verifyTransaction}
            className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Retry Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification; 