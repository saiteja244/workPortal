const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if database is connected
    if (!User.db.readyState) {
      return res.status(503).json({ message: 'Database not available' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      res.status(503).json({ message: 'Database error' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, linkedinUrl, skills, walletAddress, profileImage } = req.body;
    
    // Get current user to merge skills properly
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (linkedinUrl !== undefined) updateFields.linkedinUrl = linkedinUrl;
    if (walletAddress !== undefined) updateFields.walletAddress = walletAddress;
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    
    // Handle skills merging - combine existing and new skills without duplication
    if (skills && Array.isArray(skills)) {
      const existingSkills = currentUser.skills || [];
      const newSkills = skills;
      
      // Merge skills and remove duplicates (case-insensitive)
      const mergedSkills = [...existingSkills];
      newSkills.forEach(skill => {
        const skillLower = skill.toLowerCase().trim();
        const exists = mergedSkills.some(existingSkill => 
          existingSkill.toLowerCase().trim() === skillLower
        );
        if (!exists) {
          mergedSkills.push(skill.trim());
        }
      });
      
      updateFields.skills = mergedSkills;
      console.log(`Skills merged: ${existingSkills.length} existing + ${newSkills.length} new = ${mergedSkills.length} total`);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user,
      skillsAdded: skills ? skills.length : 0,
      totalSkills: user.skills.length
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (public profile)
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 