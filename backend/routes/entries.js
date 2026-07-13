const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');
const verifyAuthToken = require('../middleware/auth');

// Apply auth middleware to all entries routes
router.use(verifyAuthToken);

/**
 * Helper function to recalculate the running balance of a specific user's entries chronologically.
 * Sorting is done by date ascending, then by createdAt ascending to ensure a stable ordering.
 */
async function recalculateBalances(userId) {
  const entries = await Entry.find({ userId }).sort({ date: 1, createdAt: 1 });
  let runningBalance = 0;
  for (const entry of entries) {
    runningBalance += (entry.credited || 0) - (entry.debited || 0);
    entry.balance = runningBalance;
    await entry.save();
  }
}

/**
 * @route   GET /api/entries
 * @desc    Get all entries of the logged-in user sorted by date ascending
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.userId }).sort({ date: 1, createdAt: 1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Server error while fetching entries.' });
  }
});

/**
 * @route   POST /api/entries
 * @desc    Add a new entry for the logged-in user and recalculate balances
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { date, details, debited, credited, category } = req.body;
    const userId = req.userId;

    if (!date || !details) {
      return res.status(400).json({ error: 'Date and details are required.' });
    }

    const numDebited = Number(debited || 0);
    const numCredited = Number(credited || 0);

    // Calculate balance based on the previous entry chronologically by date for this user
    const previousEntry = await Entry.findOne({ userId, date: { $lte: new Date(date) } })
      .sort({ date: -1, createdAt: -1 });

    const prevBalance = previousEntry ? previousEntry.balance : 0;
    const balance = prevBalance + numCredited - numDebited;

    const newEntry = new Entry({
      userId,
      date: new Date(date),
      details,
      debited: numDebited,
      credited: numCredited,
      balance,
      category: category || 'Other'
    });

    await newEntry.save();

    // Recalculate subsequent/all entries for this user to maintain ledger accuracy
    await recalculateBalances(userId);

    // Fetch the updated entry after recalculations
    const savedEntry = await Entry.findById(newEntry._id);
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Server error while creating entry.' });
  }
});

/**
 * @route   PUT /api/entries/:id
 * @desc    Edit an entry for the logged-in user and recalculate balances chronologically
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, details, debited, credited, category } = req.body;
    const userId = req.userId;

    const entry = await Entry.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    }

    if (date !== undefined) entry.date = new Date(date);
    if (details !== undefined) entry.details = details;
    if (debited !== undefined) entry.debited = Number(debited || 0);
    if (credited !== undefined) entry.credited = Number(credited || 0);
    if (category !== undefined) entry.category = category;

    await entry.save();

    // Recalculate balances chronologically for all entries of this user
    await recalculateBalances(userId);

    const updatedEntry = await Entry.findById(id);
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Server error while updating entry.' });
  }
});

/**
 * @route   DELETE /api/entries/:id
 * @desc    Delete an entry for the logged-in user and recalculate subsequent balances
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const entry = await Entry.findOne({ _id: id, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or unauthorized.' });
    }

    await Entry.findOneAndDelete({ _id: id, userId });

    // Recalculate remaining balances for this user
    await recalculateBalances(userId);

    res.status(200).json({ message: 'Entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Server error while deleting entry.' });
  }
});

module.exports = router;
