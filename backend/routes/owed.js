const express = require('express');
const router = express.Router();
const OwedEntry = require('../models/OwedEntry');
const verifyAuthToken = require('../middleware/auth');

// Protect all owed routes with Firebase Auth middleware
router.use(verifyAuthToken);

/**
 * @route   GET /api/owed
 * @desc    Get all owed entries for the logged-in user sorted by date descending
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const entries = await OwedEntry.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching owed entries:', error);
    res.status(500).json({ error: 'Server error while fetching owed entries.' });
  }
});

/**
 * @route   POST /api/owed
 * @desc    Create a new owed entry for the logged-in user
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { friendName, amount, date, note, status } = req.body;
    const userId = req.userId;

    if (!friendName || amount === undefined || amount === null || !date) {
      return res.status(400).json({ error: "Friend's name, amount, and date are required." });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    const newEntry = new OwedEntry({
      userId,
      friendName: friendName.trim(),
      amount: numAmount,
      date: new Date(date),
      note: note ? note.trim() : '',
      status: status === 'Settled' ? 'Settled' : 'Pending'
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating owed entry:', error);
    res.status(500).json({ error: 'Server error while creating owed entry.' });
  }
});

/**
 * @route   PUT /api/owed/:id
 * @desc    Update an owed entry (used for editing details or marking as Settled)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { friendName, amount, date, note, status } = req.body;
    const userId = req.userId;

    const entry = await OwedEntry.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Owed entry not found or unauthorized.' });
    }

    if (friendName !== undefined) entry.friendName = friendName.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        entry.amount = numAmount;
      }
    }
    if (date !== undefined) entry.date = new Date(date);
    if (note !== undefined) entry.note = note.trim();
    if (status !== undefined && ['Pending', 'Settled'].includes(status)) {
      entry.status = status;
    }

    await entry.save();
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error updating owed entry:', error);
    res.status(500).json({ error: 'Server error while updating owed entry.' });
  }
});

/**
 * @route   DELETE /api/owed/:id
 * @desc    Delete an owed entry for the logged-in user
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const entry = await OwedEntry.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Owed entry not found or unauthorized.' });
    }

    await OwedEntry.findOneAndDelete({ _id: id, userId });
    res.status(200).json({ message: 'Owed entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting owed entry:', error);
    res.status(500).json({ error: 'Server error while deleting owed entry.' });
  }
});

module.exports = router;
