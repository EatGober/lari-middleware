// routes/waitlist.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error-handler');
const { authMiddleware } = require('../middleware/auth');
const { getWaitlist } = require('../WaitlistUtils');

// Apply auth middleware to all waitlist routes
// router.use(authMiddleware);

// Get waitlist entries with optional provider filtering
router.get('/:practiceid', asyncHandler(async (req, res) => {
  const { practiceid } = req.params;
  const { providerid } = req.query;

  try {
    const waitlistEntries = await getWaitlist(
      req.athenaToken,
      practiceid,
      providerid ? providerid.toString() : undefined
    );

    res.json(waitlistEntries);
  } catch (error) {
    // Handle specific API errors
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'No waitlist found for the specified practice' });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Unauthorized access to waitlist' });
    } else {
      // Re-throw other errors to be caught by the global error handler
      throw error;
    }
  }
}));

module.exports = router;
