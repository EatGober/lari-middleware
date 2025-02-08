// routes/appointments.js
/** @type {import('express').Express} */
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error-handler');

router.get('/', asyncHandler(async (req, res) => {
  // Get appointments logic
  res.json([]);
}));

router.post('/', asyncHandler(async (req, res) => {
  // Create appointment logic
  res.status(201).json({});
}));

router.get('/:id', asyncHandler(async (req, res) => {
  // Get specific appointment logic
  res.json({});
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  // Cancel appointment logic
  res.json({ message: 'Appointment cancelled' });
}));

module.exports = router;
