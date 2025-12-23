const express = require('express');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all accepted connections
    const connections = await Connection.find({
      $or: [
        { requester: req.user._id },
        { recipient: req.user._id }
      ],
      status: 'accepted'
    });

    const conversationIds = connections.map(connection => {
      const otherUserId = connection.requester.toString() === req.user._id.toString() 
        ? connection.recipient 
        : connection.requester;
      return Message.getConversationId(req.user._id, otherUserId);
    });

    // Get last message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conversation) => {
        const [user1Id, user2Id] = conversation._id.split('_');
        const otherUserId = user1Id === req.user._id.toString() ? user2Id : user1Id;
        
        const otherUser = await require('../models/User').findById(otherUserId)
          .select('name email profileImage bio');

        return {
          conversationId: conversation._id,
          otherUser,
          lastMessage: conversation.lastMessage,
          unreadCount: conversation.unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUsers });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ],
      status: 'accepted'
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only message connected users' });
    }

    const conversationId = Message.getConversationId(req.user._id, userId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email profileImage')
      .populate('recipient', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ 
      messages: messages.reverse(),
      conversationId,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', attachment } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ],
      status: 'accepted'
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only message connected users' });
    }

    const conversationId = Message.getConversationId(req.user._id, recipientId);

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      messageType,
      attachment,
      conversationId
    });

    await message.save();

    // Populate user details for response
    await message.populate('sender', 'name email profileImage');
    await message.populate('recipient', 'name email profileImage');

    res.status(201).json({
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message (only sender can delete)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 