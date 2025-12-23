const mongoose = require('mongoose');
const Job = require('./src/models/Job');
const User = require('./src/models/User');
require('dotenv').config();

// Sample jobs data
const sampleJobs = [
  {
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: 'We are looking for a senior React developer with 5+ years of experience building scalable web applications. Must have strong knowledge of React, TypeScript, and modern JavaScript frameworks.',
    skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'MongoDB', 'AWS'],
    budget: { min: 120000, max: 180000 },
    isActive: true
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'New York, NY',
    type: 'full-time',
    description: 'Join our fast-growing startup as a full stack developer. You will work on both frontend and backend development using modern technologies.',
    skills: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL'],
    budget: { min: 80000, max: 120000 },
    isActive: true
  },
  {
    title: 'Python Backend Developer',
    company: 'DataTech Solutions',
    location: 'Austin, TX',
    type: 'full-time',
    description: 'We need a Python backend developer to work on our data processing platform. Experience with Django, FastAPI, and cloud services required.',
    skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker'],
    budget: { min: 90000, max: 140000 },
    isActive: true
  },
  {
    title: 'Frontend Developer (React)',
    company: 'WebDesign Pro',
    location: 'Remote',
    type: 'contract',
    description: 'Remote contract position for a React frontend developer. Must have experience with modern React patterns and state management.',
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Redux', 'Git'],
    budget: { min: 60000, max: 90000 },
    isActive: true
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudFirst Inc.',
    location: 'Seattle, WA',
    type: 'full-time',
    description: 'Join our DevOps team to manage cloud infrastructure and CI/CD pipelines. Experience with AWS, Docker, and Kubernetes required.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux'],
    budget: { min: 100000, max: 150000 },
    isActive: true
  },
  {
    title: 'Mobile App Developer',
    company: 'AppStudio',
    location: 'Los Angeles, CA',
    type: 'full-time',
    description: 'Develop mobile applications using React Native. Must have experience with mobile development and app store deployment.',
    skills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Firebase', 'Git'],
    budget: { min: 85000, max: 130000 },
    isActive: true
  },
  {
    title: 'Machine Learning Engineer',
    company: 'AITech Solutions',
    location: 'Boston, MA',
    type: 'full-time',
    description: 'Work on cutting-edge machine learning projects. Experience with Python, TensorFlow, and data science required.',
    skills: ['Python', 'TensorFlow', 'Machine Learning', 'Data Science', 'SQL', 'AWS'],
    budget: { min: 110000, max: 170000 },
    isActive: true
  },
  {
    title: 'UI/UX Designer',
    company: 'DesignHub',
    location: 'Chicago, IL',
    type: 'full-time',
    description: 'Create beautiful and intuitive user interfaces. Must have experience with design tools and user research.',
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'HTML', 'CSS'],
    budget: { min: 70000, max: 110000 },
    isActive: true
  },
  {
    title: 'Database Administrator',
    company: 'DataSystems Corp',
    location: 'Dallas, TX',
    type: 'full-time',
    description: 'Manage and optimize our database systems. Experience with PostgreSQL, MySQL, and performance tuning required.',
    skills: ['PostgreSQL', 'MySQL', 'Database Administration', 'Performance Tuning', 'Backup', 'Security'],
    budget: { min: 80000, max: 120000 },
    isActive: true
  },
  {
    title: 'QA Engineer',
    company: 'QualityAssurance Pro',
    location: 'Remote',
    type: 'contract',
    description: 'Ensure software quality through comprehensive testing. Experience with automated testing and test frameworks required.',
    skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing', 'Test Automation', 'Git'],
    budget: { min: 65000, max: 95000 },
    isActive: true
  }
];

async function addSampleJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test employer user if it doesn't exist
    let testEmployer = await User.findOne({ email: 'employer@test.com' });
    if (!testEmployer) {
      testEmployer = new User({
        name: 'Test Employer',
        email: 'employer@test.com',
        password: 'password123',
        role: 'user',
        company: 'Test Company',
        skills: ['Management', 'Recruitment', 'HR']
      });
      await testEmployer.save();
      console.log('Created test employer user');
    }

    // Clear existing sample jobs (optional)
    // await Job.deleteMany({ company: { $in: sampleJobs.map(job => job.company) } });
    // console.log('Cleared existing sample jobs');

    // Add employer ID to all sample jobs
    const jobsWithEmployer = sampleJobs.map(job => ({
      ...job,
      employer: testEmployer._id
    }));

    // Add sample jobs
    const addedJobs = await Job.insertMany(jobsWithEmployer);
    console.log(`Successfully added ${addedJobs.length} sample jobs:`);
    
    addedJobs.forEach(job => {
      console.log(`- ${job.title} at ${job.company}`);
    });

    console.log('\nSample jobs added successfully! You can now test the AI features.');
    console.log(`Test employer user: ${testEmployer.email} (password: password123)`);
  } catch (error) {
    console.error('Error adding sample jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addSampleJobs(); 