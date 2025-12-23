# Job & Networking Portal

A full-stack web application inspired by LinkedIn, Upwork, and AngelList, enhanced with AI-powered features and Web3 blockchain integration.

## 🚀 Features

- **User Authentication & Profiles**: JWT-based auth with comprehensive user profiles
- **Job Posting & Management**: Create, view, and manage job listings
- **AI-Powered Matching**: Smart job-candidate matching using NLP
- **Web3 Integration**: MetaMask wallet connection and blockchain payments
- **Smart Contract**: Solidity contract for on-chain payment logging
- **Social Feed**: Professional networking with posts, likes, and comments
- **Skill Extraction**: AI-powered skill parsing from resumes and bios

## 🛠 Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Ethers.js** - Web3 integration
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Blockchain
- **Ethereum** - Blockchain network
- **MetaMask** - Wallet integration
- **Solidity** - Smart contracts
- **Hardhat** - Development framework

### AI/ML
- **OpenAI API** - NLP and skill extraction
- **Natural language processing** - Job matching algorithms

## 📁 Project Structure

```
Intern/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── package.json
│   └── env.example
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # React contexts
│   │   ├── utils/          # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── tailwind.config.js
│   └── package.json
├── smart-contract/          # Solidity smart contracts
│   ├── contracts/
│   │   └── JobPortal.sol   # Main contract
│   ├── scripts/            # Deployment scripts
│   └── README.md
└── README.md
```

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

### Deploy to Vercel
```bash
# Check deployment readiness
npm run deploy:check

# Follow the deployment guide
# See: DEPLOYMENT.md or VERCEL_DEPLOYMENT_QUICK_START.md
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost/your-database-name
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
ADMIN_WALLET_ADDRESS=your-ethereum-wallet-address
PLATFORM_FEE=0.001
OPENAI_API_KEY=your-openai-api-key-here
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-domain.vercel.app/api
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/user/:id` - Get user by ID

### Jobs
- `GET /api/jobs` - Get all jobs with filtering
- `POST /api/jobs` - Create job posting (requires Web3 payment)
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/user/my-jobs` - Get user's posted jobs
- `GET /api/jobs/user/applications` - Get user's applications

### Posts (Coming Soon)
- `GET /api/posts` - Get social feed
- `POST /api/posts` - Create post
- `PUT /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment

## 🤖 AI Features

### Job Matching
- Analyzes job descriptions and candidate profiles
- Calculates match scores based on skills and requirements
- Provides personalized job recommendations

### Skill Extraction
- Parses resumes and bios to extract skills
- Auto-fills skill tags in user profiles
- Identifies skill gaps and suggestions

## 💰 Web3 Integration

### Wallet Connection
- MetaMask integration for Ethereum wallet
- Secure wallet address verification
- Transaction signing and verification
- Network detection and switching

### Payment System
- Platform fee collection in ETH (0.001 ETH per job posting)
- On-chain payment logging via smart contract
- Transaction verification and confirmation
- Payment history tracking

### Smart Contract Features
- **JobPortal.sol**: Main contract for payment logging
- Payment verification and job posting validation
- Admin controls for fee management
- Event emission for transparency
- User payment history tracking

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication
- [x] Basic UI with Tailwind CSS
- [x] MongoDB models
- [x] Express server setup

### Phase 2: Job Management ✅
- [x] Job posting and listing
- [x] Job search and filtering
- [x] Application system
- [x] Pagination and advanced search

### Phase 3: Web3 Integration ✅
- [x] MetaMask wallet connection
- [x] Payment processing
- [x] Smart contract deployment
- [x] On-chain payment logging

### Phase 4: AI Features
- [ ] OpenAI API integration
- [ ] Job matching algorithm
- [ ] Skill extraction

### Phase 5: Social Features
- [ ] Social feed
- [ ] Networking features
- [ ] Messaging system

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Smart Contract Testing
```bash
cd smart-contract
npx hardhat test
```

## 🚀 Deployment

### Prerequisites
- GitHub repository
- MongoDB Atlas account
- Vercel account

### Quick Deployment Steps
1. **Prepare Code**: `npm run deploy:check`
2. **Set up MongoDB Atlas**: Create cluster and get connection string
3. **Deploy to Vercel**: Import GitHub repo and configure environment variables
4. **Verify**: Test API health and frontend functionality

For detailed instructions, see:
- 📖 [Full Deployment Guide](DEPLOYMENT.md)
- ⚡ [Quick Start Guide](VERCEL_DEPLOYMENT_QUICK_START.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

- Check the [troubleshooting section](DEPLOYMENT.md#troubleshooting) in the deployment guide
- Run `npm run deploy:check` to validate your setup
- Review Vercel deployment logs for build issues

---



### 🏆 **Achievement Summary**

This project demonstrates:
- ✅ **Full-stack development** with React, Node.js, and MongoDB
- ✅ **Web3 integration** with MetaMask and Ethereum
- ✅ **Smart contract development** in Solidity
- ✅ **Professional UI/UX** with Tailwind CSS
- ✅ **Secure authentication** with JWT
- ✅ **Advanced job management** with filtering and pagination
- ✅ **Blockchain payments** with transaction verification
- ✅ **Clean architecture** with proper separation of concerns 
