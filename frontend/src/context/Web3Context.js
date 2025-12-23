import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initializeWeb3,
  getCurrentAccount,
  getAccountBalance,
  sendPayment,
  onAccountChange,
  onNetworkChange,
  getNetworkInfo,
  isMetaMaskInstalled,
  isMetaMaskConnected,
  formatAddress,
  switchNetwork,
  getSupportedNetworks
} from '../utils/web3';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [supportedNetworks] = useState(getSupportedNetworks());

  const updateBalance = useCallback(async (address) => {
    try {
      const balance = await getAccountBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Update balance error:', error);
    }
  }, []);

  const updateNetworkInfo = useCallback(async () => {
    try {
      const networkInfo = await getNetworkInfo();
      setNetwork(networkInfo);
    } catch (error) {
      console.error('Update network info error:', error);
    }
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const connected = await isMetaMaskConnected();
      setIsConnected(connected);
      
      if (connected) {
        const address = await getCurrentAccount();
        setWalletAddress(address);
        await updateBalance(address);
        await updateNetworkInfo();
      }
    } catch (error) {
      console.error('Check connection status error:', error);
    }
  }, [updateBalance, updateNetworkInfo]);

  const handleAccountChange = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setWalletAddress('');
      setBalance('0');
      setIsConnected(false);
      setNetwork(null);
    } else {
      // User switched accounts
      const address = accounts[0];
      setWalletAddress(address);
      setIsConnected(true);
      await updateBalance(address);
      await updateNetworkInfo();
    }
  }, [updateBalance, updateNetworkInfo]);

  const handleNetworkChange = useCallback(async () => {
    await updateNetworkInfo();
  }, [updateNetworkInfo]);

  // Check initial connection status
  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Set up event listeners
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      onAccountChange(handleAccountChange);
      onNetworkChange(handleNetworkChange);
    }
  }, [handleAccountChange, handleNetworkChange]);

  const connectWallet = async (preferredNetwork = 'goerli') => {
    try {
      setIsConnecting(true);
      setError(null);

      await initializeWeb3();
      
      // Try to switch to preferred network
      try {
        await switchNetwork(preferredNetwork);
      } catch (networkError) {
        console.warn('Failed to switch network, continuing with current network:', networkError.message);
      }
      
      const address = await getCurrentAccount();
      
      setWalletAddress(address);
      setIsConnected(true);
      await updateBalance(address);
      await updateNetworkInfo();

      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to connect wallet';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setBalance('0');
    setIsConnected(false);
    setNetwork(null);
    setError(null);
  };

  const makePayment = async (toAddress, amount, gasPrice = null) => {
    try {
      setError(null);
      
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      const result = await sendPayment(toAddress, amount, gasPrice);
      
      // Update balance after successful payment
      await updateBalance(walletAddress);
      
      return { success: true, data: result };
    } catch (error) {
      const message = error.message || 'Payment failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const changeNetwork = async (networkName) => {
    try {
      setError(null);
      const result = await switchNetwork(networkName);
      await updateNetworkInfo();
      return result;
    } catch (error) {
      const message = error.message || 'Failed to switch network';
      setError(message);
      return { success: false, error: message };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    walletAddress,
    balance,
    network,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    makePayment,
    changeNetwork,
    clearError,
    formatAddress: (address) => formatAddress(address || walletAddress),
    isMetaMaskInstalled: isMetaMaskInstalled(),
    supportedNetworks
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}; 