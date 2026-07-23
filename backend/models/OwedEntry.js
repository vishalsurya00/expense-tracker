const mongoose = require('mongoose');

const OwedEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  friendName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Settled'],
    default: 'Pending'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('OwedEntry', OwedEntrySchema);
