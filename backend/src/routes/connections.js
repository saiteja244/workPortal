const express = require('express');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all connections for current user
router.get('/', auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .populate('requester', 'name email profileImage bio skills')
    .populate('recipient', 'name email profileImage bio skills')
    .sort({ updatedAt: -1 });

    const formattedConnections = connections.map(connection => {
      const otherUser = connection.requester._id.toString() === req.user._id.toString() 
        ? connection.recipient 
        : connection.requester;
      
      return {
        _id: connection._id,
        otherUser,
        status: connection.status,
        message: connection.message,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
        isRequester: connection.requester._id.toString() === req.user._id.toString()
      };
    });

    res.json({ connections: formattedConnections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send connection request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ 
        message: 'Connection request already exists',
        status: existingConnection.status
      });
    }

    const connection = new Connection({
      requester: req.user._id,
      recipient: recipientId,
      message: message || ''
    });

    await connection.save();

    // Populate user details for response
    await connection.populate('requester', 'name email profileImage bio');
    await connection.populate('recipient', 'name email profileImage bio');

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
router.put('/:connectionId/accept', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is not pending' });
    }

    connection.status = 'accepted';
    connection.updatedAt = new Date();
    await connection.save();

    await connection.populate('requester', 'name email profileImage bio');
    await connection.populate('recipient', 'name email profileImage bio');

    res.json({
      message: 'Connection request accepted',
      connection
    });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject connection request
router.put('/:connectionId/reject', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is not pending' });
    }

    connection.status = 'rejected';
    connection.updatedAt = new Date();
    await connection.save();

    res.json({
      message: 'Connection request rejected',
      connection
    });
  } catch (error) {
    console.error('Reject connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove connection
router.delete('/:connectionId', auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.requester.toString() !== req.user._id.toString() && 
        connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove this connection' });
    }

    await Connection.findByIdAndDelete(req.params.connectionId);

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending connection requests
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingConnections = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'name email profileImage bio skills')
    .sort({ createdAt: -1 });

    res.json({ connections: pendingConnections });
  } catch (error) {
    console.error('Get pending connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users to connect with
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    let query = { _id: { $ne: req.user._id } };
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const users = await User.find(query)
      .select('name email profileImage bio skills')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    // Check connection status for each user
    const usersWithConnectionStatus = await Promise.all(
      users.map(async (user) => {
        const connection = await Connection.findOne({
          $or: [
            { requester: req.user._id, recipient: user._id },
            { requester: user._id, recipient: req.user._id }
          ]
        });

        return {
          ...user.toObject(),
          connectionStatus: connection ? connection.status : null,
          connectionId: connection ? connection._id : null
        };
      })
    );

    res.json({ users: usersWithConnectionStatus });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 