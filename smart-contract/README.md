# Job Portal Smart Contract

A Solidity smart contract for the Job & Networking Portal that handles job posting payments and verification on the Ethereum blockchain.

## Features

- **Job Posting with Payment**: Users must pay a fee in ETH to post jobs
- **Payment Verification**: All payments are logged on-chain with transaction hashes
- **Job Management**: Employers can deactivate their job postings
- **Payment Logging**: Complete audit trail of all payments
- **Admin Functions**: Contract owner can update fees and withdraw funds

## Contract Functions

### Public Functions
- `postJob()` - Post a new job with payment
- `getJob()` - Get job details by ID
- `getEmployerJobs()` - Get all jobs by an employer
- `getPaymentLog()` - Get payment details by transaction hash
- `getContractStats()` - Get contract statistics

### Employer Functions
- `deactivateJob()` - Deactivate a job posting (only job owner)

### Admin Functions
- `updateJobPostingFee()` - Update the job posting fee
- `withdrawFunds()` - Withdraw accumulated fees

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
TESTNET_RPC_URL=https://goerli.infura.io/v3/YOUR-PROJECT-ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Compilation

```bash
npm run compile
```

## Testing

```bash
npm run test
```

## Deployment

### Local Development
```bash
npx hardhat node
npm run deploy
```

### Testnet (Goerli)
```bash
npm run deploy:testnet
```

### Mainnet
```bash
npm run deploy:mainnet
```

## Contract Addresses

After deployment, the contract address will be displayed. Save this address for frontend integration.

## Integration with Frontend

The frontend can interact with this contract using ethers.js:

```javascript
import { ethers } from 'ethers';

// Contract ABI and address
const contractAddress = 'DEPLOYED_CONTRACT_ADDRESS';
const contractABI = [...]; // Generated from compilation

// Connect to contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

// Post a job
const tx = await contract.postJob(
  "Senior Developer",
  "Tech Corp",
  "We are looking for...",
  ethers.utils.parseEther("5000"),
  ethers.utils.parseEther("10000"),
  "USD",
  { value: ethers.utils.parseEther("0.01") }
);

await tx.wait();
```

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Admin functions restricted to contract owner
- **Input Validation**: Comprehensive validation of all inputs
- **Safe Math**: Built-in overflow protection (Solidity 0.8+)

## Gas Optimization

- Contract uses Solidity 0.8.19 with optimizer enabled
- Efficient data structures and mappings
- Minimal storage operations

## License

MIT License 