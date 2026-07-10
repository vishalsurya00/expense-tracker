const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
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
    enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Education', 'Health', 'Salary', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('Entry', EntrySchema);
