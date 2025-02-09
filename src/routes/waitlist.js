// routes/waitlist.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error-handler');
const { authMiddleware } = require('../middleware/auth');
const { getWaitlist,enhanceWaitlistWithAppointments } = require('../WaitlistUtils');

// Apply auth middleware to all waitlist routes
router.use(authMiddleware);

// Get waitlist entries with optional provider filtering
router.get('/:practiceid/:departmentid/:providerid', asyncHandler(async (req, res) => {
  const { practiceid, departmentid, providerid } = req.params;

  try {
    const waitlistEntries = await getWaitlist(
      req.athenaToken,
      practiceid,
    departmentid ? departmentid.toString() : undefined,
      providerid ? providerid.toString() : undefined
  );
    console.log('Waitlist Response from route:', waitlistEntries);


    const enhancedWaitlist = await enhanceWaitlistWithAppointments(
      waitlistEntries,
      req.athenaToken,
      practiceid,

    );
    console.log('Enhanced Waitlist:', enhancedWaitlist); // Add this log
    res.json(enhancedWaitlist);
  } catch (error) {
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
