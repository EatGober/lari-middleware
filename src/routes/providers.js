// routes/providers.js
/** @type {import('express').Express} */
const express = require('express');
const router = express.Router();

// Get all providers
router.get('/', (req, res) => {
  const { specialty, available } = req.query;
  res.json([
    {
      id: '123',
      name: 'Dr. Smith',
      specialty: 'Cardiology',
      availableForAppointments: true
    }
  ]);
});

// Get specific provider
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    name: 'Dr. Smith',
    specialty: 'Cardiology',
    availableForAppointments: true
  });
});

// Get provider availability
router.get('/:id/availability', (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  res.json([
    {
      startTime: '2024-02-01T09:00:00Z',
      endTime: '2024-02-01T10:00:00Z',
      available: true,
      appointmentType: ['initial', 'followup']
    }
  ]);
});

// Get provider schedule
router.get('/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  res.json([
    {
      date: '2024-02-01',
      slots: [
        {
          startTime: '2024-02-01T09:00:00Z',
          endTime: '2024-02-01T10:00:00Z',
          status: 'booked'
        }
      ]
    }
  ]);
});

module.exports = router;
