const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const upload = require('../middleware/upload');
const { auth, adminOnly } = require('../middleware/auth');

// GET: all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses.' });
  }
});

// POST: add new course
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, type, imageUrl } = req.body;

    const parsedTypes = Array.isArray(type) ? type : JSON.parse(type);

    const newCourse = new Course({
      name,
      type: parsedTypes,
      description,
      imageUrl,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// PUT: update course
router.put('/:id', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const parsedTypes = JSON.parse(req.body.type); // stringified from frontend

    const update = {
      name,
      type: parsedTypes,
      description,
    };

    if (req.file) {
      update.imageUrl = req.file.path;
      update.imagePublicId = req.file.filename;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE: remove course
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete course.' });
  }
});

module.exports = router;
