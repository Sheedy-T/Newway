// At the top of your route file (e.g., routes/auth.js or routes/users.js)

const express = require('express');
const router = express.Router(); // <--- THIS LINE IS CRUCIAL
const { auth } = require('../middleware/auth'); // Assuming your auth middleware path
const User = require('../models/User'); // Assuming your User model path

// Your GET user profile route
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ... other routes in this file (e.g., login, register)

module.exports = router; // <--- THIS LINE IS ALSO CRUCIAL, at the very end