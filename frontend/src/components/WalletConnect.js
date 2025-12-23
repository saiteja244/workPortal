import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';

const WalletConnect = () => {
  const {
    walletAddress,
    balance,
    network,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
    isMetaMaskInstalled,
    changeNetwork,
    supportedNetworks
  } = useWeb3();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowNetworkSelector(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
      return;
    }
    
    const result = await connectWallet('goerli');
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  const handleNetworkChange = async (networkName) => {
    try {
      await changeNetwork(networkName);
      setShowNetworkSelector(false);
    } catch (error) {
      alert(`Failed to switch network: ${error.message}`);
    }
  };

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      42: 'Kovan Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon',
      80001: 'Mumbai Testnet'
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="flex items-center">
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 text-sm"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Wallet</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50">
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Wallet Info</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                {walletAddress}
              </p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Balance:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {parseFloat(balance).toFixed(4)} ETH
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Network:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {network ? getNetworkName(network.chainId) : 'Unknown'}
                </span>
              </div>
            </div>

            {error && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {error}
                  <button
                    onClick={clearError}
                    className="ml-2 text-red-800 dark:text-red-300 hover:text-red-900"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
              <button
                onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Switch Network
              </button>
              
              {showNetworkSelector && (
                <div className="bg-gray-50 dark:bg-gray-600 p-2 rounded space-y-1">
                  {supportedNetworks.map((networkName) => (
                    <button
                      key={networkName}
                      onClick={() => handleNetworkChange(networkName)}
                      className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 capitalize"
                    >
                      {networkName}
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={handleDisconnect}
                className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 