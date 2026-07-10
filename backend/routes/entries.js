const express = require('express');
const router = express.Router();
const Entry = require('../models/Entry');

/**
 * Helper function to recalculate the running balance of all entries chronologically.
 * Sorting is done by date ascending, then by createdAt ascending to ensure a stable ordering.
 */
async function recalculateBalances() {
  const entries = await Entry.find().sort({ date: 1, createdAt: 1 });
  let runningBalance = 0;
  for (const entry of entries) {
    runningBalance += (entry.credited || 0) - (entry.debited || 0);
    entry.balance = runningBalance;
    await entry.save();
  }
}

/**
 * @route   GET /api/entries
 * @desc    Get all entries sorted by date ascending
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ date: 1, createdAt: 1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Server error while fetching entries.' });
  }
});

/**
 * @route   POST /api/entries
 * @desc    Add a new entry and recalculate balances
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { date, details, debited, credited, category } = req.body;
    if (!date || !details) {
      return res.status(400).json({ error: 'Date and details are required.' });
    }

    const numDebited = Number(debited || 0);
    const numCredited = Number(credited || 0);

    // Calculate balance based on the previous entry chronologically by date
    const previousEntry = await Entry.findOne({ date: { $lte: new Date(date) } })
      .sort({ date: -1, createdAt: -1 });

    const prevBalance = previousEntry ? previousEntry.balance : 0;
    const balance = prevBalance + numCredited - numDebited;

    const newEntry = new Entry({
      date: new Date(date),
      details,
      debited: numDebited,
      credited: numCredited,
      balance,
      category: category || 'Other'
    });

    await newEntry.save();

    // Recalculate subsequent/all entries to maintain ledger accuracy
    await recalculateBalances();

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
 * @desc    Edit an entry and recalculate balances chronologically
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, details, debited, credited, category } = req.body;

    const entry = await Entry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    if (date !== undefined) entry.date = new Date(date);
    if (details !== undefined) entry.details = details;
    if (debited !== undefined) entry.debited = Number(debited || 0);
    if (credited !== undefined) entry.credited = Number(credited || 0);
    if (category !== undefined) entry.category = category;

    await entry.save();

    // Recalculate balances chronologically for all entries
    await recalculateBalances();

    const updatedEntry = await Entry.findById(id);
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Server error while updating entry.' });
  }
});

/**
 * @route   DELETE /api/entries/:id
 * @desc    Delete an entry and recalculate subsequent balances
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await Entry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    await Entry.findByIdAndDelete(id);

    // Recalculate remaining balances
    await recalculateBalances();

    res.status(200).json({ message: 'Entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Server error while deleting entry.' });
  }
});

module.exports = router;
