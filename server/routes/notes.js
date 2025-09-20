const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    const note = new Note({ userId: req.userId, title, content });
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    note.title = req.body.title ?? note.title;
    note.content = req.body.content ?? note.content;
    note.updatedAt = new Date();
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    await note.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;