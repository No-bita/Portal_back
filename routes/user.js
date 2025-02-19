const express = require('express');
const User = require('../models/user');
const { ensureAuth } = require('../middleware/authmiddleware');

const router = express.Router();

// Fetch User Details (Protected Route)
router.get('/profile', ensureAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        
        res.json({ user });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
});

module.exports = router; 