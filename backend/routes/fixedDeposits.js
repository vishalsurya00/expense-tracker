const express = require('express');
const router = express.Router();
const FixedDeposit = require('../models/FixedDeposit');
const verifyAuthToken = require('../middleware/auth');

// Protect all fixed deposit routes with Firebase Auth middleware
router.use(verifyAuthToken);

/**
 * @route   GET /api/fixed-deposits
 * @desc    Get all fixed deposit entries for the logged-in user sorted by closing date ascending
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const entries = await FixedDeposit.find({ userId: req.userId }).sort({ closingDate: 1, createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching fixed deposits:', error);
    res.status(500).json({ error: 'Server error while fetching fixed deposits.' });
  }
});

/**
 * @route   POST /api/fixed-deposits
 * @desc    Create a new fixed deposit for the logged-in user
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { details, depositedAmount, depositedDate, closingDate, interestRate, totalAmount, status } = req.body;
    const userId = req.userId;

    if (!details || depositedAmount === undefined || depositedAmount === null || !depositedDate || !closingDate || interestRate === undefined || interestRate === null || totalAmount === undefined || totalAmount === null) {
      return res.status(400).json({ error: 'Details, deposited amount, deposited date, closing date, interest rate, and total amount are required.' });
    }

    const numDepositedAmount = Number(depositedAmount);
    const numInterestRate = Number(interestRate);
    const numTotalAmount = Number(totalAmount);

    if (isNaN(numDepositedAmount) || numDepositedAmount <= 0) {
      return res.status(400).json({ error: 'Deposited amount must be a positive number.' });
    }
    if (isNaN(numInterestRate) || numInterestRate < 0) {
      return res.status(400).json({ error: 'Interest rate must be a non-negative number.' });
    }
    if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be a positive number.' });
    }

    const newFD = new FixedDeposit({
      userId,
      details: details.trim(),
      depositedAmount: numDepositedAmount,
      depositedDate: new Date(depositedDate),
      closingDate: new Date(closingDate),
      interestRate: numInterestRate,
      totalAmount: numTotalAmount,
      status: status === 'Credited' ? 'Credited' : 'Active'
    });

    await newFD.save();
    res.status(201).json(newFD);
  } catch (error) {
    console.error('Error creating fixed deposit:', error);
    res.status(500).json({ error: 'Server error while creating fixed deposit.' });
  }
});

/**
 * @route   PUT /api/fixed-deposits/:id
 * @desc    Update a fixed deposit (editing details or marking as Credited)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { details, depositedAmount, depositedDate, closingDate, interestRate, totalAmount, status } = req.body;
    const userId = req.userId;

    const entry = await FixedDeposit.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Fixed deposit not found or unauthorized.' });
    }

    if (details !== undefined) entry.details = details.trim();
    if (depositedAmount !== undefined) {
      const numAmount = Number(depositedAmount);
      if (!isNaN(numAmount) && numAmount > 0) entry.depositedAmount = numAmount;
    }
    if (depositedDate !== undefined) entry.depositedDate = new Date(depositedDate);
    if (closingDate !== undefined) entry.closingDate = new Date(closingDate);
    if (interestRate !== undefined) {
      const numRate = Number(interestRate);
      if (!isNaN(numRate) && numRate >= 0) entry.interestRate = numRate;
    }
    if (totalAmount !== undefined) {
      const numTotal = Number(totalAmount);
      if (!isNaN(numTotal) && numTotal > 0) entry.totalAmount = numTotal;
    }
    if (status !== undefined && ['Active', 'Credited'].includes(status)) {
      entry.status = status;
    }

    await entry.save();
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error updating fixed deposit:', error);
    res.status(500).json({ error: 'Server error while updating fixed deposit.' });
  }
});

/**
 * @route   DELETE /api/fixed-deposits/:id
 * @desc    Delete a fixed deposit for the logged-in user
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const entry = await FixedDeposit.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Fixed deposit not found or unauthorized.' });
    }

    await FixedDeposit.findOneAndDelete({ _id: id, userId });
    res.status(200).json({ message: 'Fixed deposit deleted successfully.' });
  } catch (error) {
    console.error('Error deleting fixed deposit:', error);
    res.status(500).json({ error: 'Server error while deleting fixed deposit.' });
  }
});

module.exports = router;
