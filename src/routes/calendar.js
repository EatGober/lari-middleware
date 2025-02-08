// routes/calendar.js
/** @type {import('express').Express} */
const express = require('express');
const router = express.Router();

// Get available slots
router.get('/available', (req, res) => {
  const { startDate, endDate, providerId } = req.query;
  res.json([
    {
      startTime: '2024-02-01T09:00:00Z',
      endTime: '2024-02-01T10:00:00Z',
      available: true
    }
  ]);
});

// Get provider schedule
router.get('/provider/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  res.json([
    {
      startTime: '2024-02-01T09:00:00Z',
      endTime: '2024-02-01T10:00:00Z',
      type: 'appointment',
      appointmentId: '123'
    }
  ]);
});

module.exports = router;
