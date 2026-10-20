const mongoose = require('mongoose');
const { CATEGORIES } = require('../constants/categories');

const EntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  debited: {
    type: Number,
    default: 0
  },
  credited: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number
  },
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'Other'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('Entry', EntrySchema);
