// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract JobPortal is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _jobIds;
    
    struct Job {
        uint256 id;
        address employer;
        string title;
        string company;
        string description;
        uint256 budgetMin;
        uint256 budgetMax;
        string currency;
        bool isActive;
        uint256 createdAt;
        uint256 paymentAmount;
        string paymentTxHash;
    }
    
    struct PaymentLog {
        address from;
        uint256 amount;
        uint256 jobId;
        uint256 timestamp;
        string txHash;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256[]) public employerJobs;
    mapping(string => PaymentLog) public paymentLogs;
    
    uint256 public jobPostingFee = 0.01 ether; // 0.01 ETH
    uint256 public totalJobsPosted = 0;
    uint256 public totalRevenue = 0;
    
    event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 paymentAmount);
    event PaymentReceived(address indexed from, uint256 amount, uint256 jobId, string txHash);
    event JobDeactivated(uint256 indexed jobId, address indexed employer);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    
    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].employer != address(0), "Job does not exist");
        _;
    }
    
    modifier onlyJobOwner(uint256 jobId) {
        require(jobs[jobId].employer == msg.sender, "Not the job owner");
        _;
    }
    
    constructor() {
        _jobIds.increment(); // Start from 1
    }
    
    function postJob(
        string memory title,
        string memory company,
        string memory description,
        uint256 budgetMin,
        uint256 budgetMax,
        string memory currency
    ) external payable nonReentrant {
        require(msg.value >= jobPostingFee, "Insufficient payment for job posting");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(company).length > 0, "Company cannot be empty");
        require(budgetMin > 0 && budgetMax >= budgetMin, "Invalid budget range");
        
        uint256 jobId = _jobIds.current();
        _jobIds.increment();
        
        jobs[jobId] = Job({
            id: jobId,
            employer: msg.sender,
            title: title,
            company: company,
            description: description,
            budgetMin: budgetMin,
            budgetMax: budgetMax,
            currency: currency,
            isActive: true,
            createdAt: block.timestamp,
            paymentAmount: msg.value,
            paymentTxHash: ""
        });
        
        employerJobs[msg.sender].push(jobId);
        totalJobsPosted++;
        totalRevenue += msg.value;
        
        // Log payment
        string memory txHash = _generateTxHash(jobId, msg.sender);
        paymentLogs[txHash] = PaymentLog({
            from: msg.sender,
            amount: msg.value,
            jobId: jobId,
            timestamp: block.timestamp,
            txHash: txHash
        });
        
        jobs[jobId].paymentTxHash = txHash;
        
        emit JobPosted(jobId, msg.sender, title, msg.value);
        emit PaymentReceived(msg.sender, msg.value, jobId, txHash);
    }
    
    function getJob(uint256 jobId) external view jobExists(jobId) returns (
        uint256 id,
        address employer,
        string memory title,
        string memory company,
        string memory description,
        uint256 budgetMin,
        uint256 budgetMax,
        string memory currency,
        bool isActive,
        uint256 createdAt,
        uint256 paymentAmount,
        string memory paymentTxHash
    ) {
        Job memory job = jobs[jobId];
        return (
            job.id,
            job.employer,
            job.title,
            job.company,
            job.description,
            job.budgetMin,
            job.budgetMax,
            job.currency,
            job.isActive,
            job.createdAt,
            job.paymentAmount,
            job.paymentTxHash
        );
    }
    
    function getEmployerJobs(address employer) external view returns (uint256[] memory) {
        return employerJobs[employer];
    }
    
    function deactivateJob(uint256 jobId) external jobExists(jobId) onlyJobOwner(jobId) {
        require(jobs[jobId].isActive, "Job is already inactive");
        jobs[jobId].isActive = false;
        emit JobDeactivated(jobId, msg.sender);
    }
    
    function getPaymentLog(string memory txHash) external view returns (
        address from,
        uint256 amount,
        uint256 jobId,
        uint256 timestamp,
        string memory txHash_
    ) {
        PaymentLog memory log = paymentLogs[txHash];
        require(log.from != address(0), "Payment log not found");
        return (log.from, log.amount, log.jobId, log.timestamp, log.txHash);
    }
    
    function updateJobPostingFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = jobPostingFee;
        jobPostingFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }
    
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    function getContractStats() external view returns (
        uint256 totalJobs,
        uint256 totalRevenue_,
        uint256 currentFee,
        uint256 contractBalance
    ) {
        return (
            totalJobsPosted,
            totalRevenue,
            jobPostingFee,
            address(this).balance
        );
    }
    
    function _generateTxHash(uint256 jobId, address employer) internal view returns (string memory) {
        return string(abi.encodePacked(
            "0x",
            _toHexString(jobId),
            _toHexString(uint256(uint160(employer))),
            _toHexString(block.timestamp)
        ));
    }
    
    function _toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 4;
        }
        
        bytes memory buffer = new bytes(length);
        while (value != 0) {
            length -= 1;
            buffer[length] = bytes1(uint8(48 + uint8(value & 0xf)));
            if (uint8(value & 0xf) > 9) {
                buffer[length] = bytes1(uint8(87 + uint8(value & 0xf)));
            }
            value >>= 4;
        }
        
        return string(buffer);
    }
    
    // Fallback function to receive ETH
    receive() external payable {
        // Accept ETH payments
    }
} 