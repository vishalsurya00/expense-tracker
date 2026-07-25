const mongoose = require('mongoose');

const FixedDepositSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  depositedAmount: {
    type: Number,
    required: true
  },
  depositedDate: {
    type: Date,
    required: true
  },
  closingDate: {
    type: Date,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Credited'],
    default: 'Active'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('FixedDeposit', FixedDepositSchema);
