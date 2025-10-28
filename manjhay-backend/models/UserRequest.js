const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserRequest', userRequestSchema);