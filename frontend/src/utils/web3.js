import { ethers } from 'ethers';

// Web3 provider and signer
let provider = null;
let signer = null;

// Network configurations with fallback RPC endpoints
const NETWORKS = {
  goerli: {
    chainId: '0x5', // 5 in hex
    chainName: 'Goerli Testnet',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://eth-goerli.g.alchemy.com/v2/demo',
      'https://rpc.goerli.mudit.blog/'
    ],
    blockExplorerUrls: ['https://goerli.etherscan.io/']
  },
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://rpc.sepolia.org/'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  }
};

// Initialize Web3 provider
export const initializeWeb3 = async () => {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    return { provider, signer };
  } catch (error) {
    console.error('Web3 initialization error:', error);
    throw error;
  }
};

// Switch to a specific network
export const switchNetwork = async (networkName = 'goerli') => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    const network = NETWORKS[networkName];
    if (!network) {
      throw new Error(`Network ${networkName} not supported`);
    }

    // Try to switch to the network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw switchError;
      }
    }

    // Reinitialize provider after network switch
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    return { success: true, network: networkName };
  } catch (error) {
    console.error('Switch network error:', error);
    throw error;
  }
};

// Get current account
export const getCurrentAccount = async () => {
  try {
    if (!signer) {
      await initializeWeb3();
    }
    const address = await signer.getAddress();
    return address;
  } catch (error) {
    console.error('Get account error:', error);
    throw error;
  }
};

// Get account balance
export const getAccountBalance = async (address) => {
  try {
    if (!provider) {
      await initializeWeb3();
    }
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    throw error;
  }
};

// Send payment transaction
export const sendPayment = async (toAddress, amount, gasPrice = null) => {
  try {
    if (!signer) {
      await initializeWeb3();
    }

    const fromAddress = await signer.getAddress();
    const balance = await provider.getBalance(fromAddress);
    
    // Convert amount to Wei
    const amountWei = ethers.utils.parseEther(amount.toString());
    
    // Check if user has enough balance
    if (balance.lt(amountWei)) {
      throw new Error('Insufficient balance for this transaction');
    }

    // Prepare transaction
    const tx = {
      to: toAddress,
      value: amountWei,
      gasLimit: 21000, // Standard ETH transfer gas limit
    };

    // Add gas price if provided
    if (gasPrice) {
      tx.gasPrice = ethers.utils.parseUnits(gasPrice, 'gwei');
    }

    // Send transaction
    const transaction = await signer.sendTransaction(tx);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Send payment error:', error);
    throw error;
  }
};

// Listen for account changes
export const onAccountChange = (callback) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen for network changes
export const onNetworkChange = (callback) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', callback);
  }
};

// Get network information
export const getNetworkInfo = async () => {
  try {
    if (!provider) {
      await initializeWeb3();
    }
    const network = await provider.getNetwork();
    return {
      chainId: network.chainId,
      name: network.name
    };
  } catch (error) {
    console.error('Get network info error:', error);
    throw error;
  }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

// Check if MetaMask is connected
export const isMetaMaskConnected = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      return false;
    }
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Check MetaMask connection error:', error);
    return false;
  }
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Validate Ethereum address
export const isValidAddress = (address) => {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

// Get supported networks
export const getSupportedNetworks = () => {
  return Object.keys(NETWORKS);
}; 