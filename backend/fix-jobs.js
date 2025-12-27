const mongoose = require('mongoose');
const Job = require('./src/models/Job');
require('dotenv').config();

async function fixJobs() {
  try {
    // Validate env variable
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find jobs that might be missing the employer field
    const jobsWithoutEmployer = await Job.find({
      employer: { $exists: false }
    });

    console.log(
      `🔍 Found ${jobsWithoutEmployer.length} jobs without employer field`
    );

    if (jobsWithoutEmployer.length > 0) {
      console.log('⚠️ These jobs need to be fixed manually or deleted:');
      jobsWithoutEmployer.forEach(job => {
        console.log(`- Job ID: ${job._id}, Title: ${job.title}`);
      });
    }

    // Find jobs with postedBy field (legacy data)
    const jobsWithPostedBy = await Job.find({
      postedBy: { $exists: true }
    });

    console.log(
      `🔍 Found ${jobsWithPostedBy.length} jobs with postedBy field`
    );

    if (jobsWithPostedBy.length > 0) {
      console.log('⚠️ These jobs should be migrated to employer field:');
      jobsWithPostedBy.forEach(job => {
        console.log(
          `- Job ID: ${job._id}, Title: ${job.title}, postedBy: ${job.postedBy}`
        );
      });
    }

    // Check total number of jobs
    const totalJobs = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${totalJobs}`);

    // Check jobs with proper employer field
    const jobsWithEmployer = await Job.countDocuments({
      employer: { $exists: true }
    });

    console.log(`✅ Jobs with employer field: ${jobsWithEmployer}`);

  } catch (error) {
    console.error('❌ Error while fixing jobs:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run script
fixJobs();
