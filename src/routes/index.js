/** @type {import('express').Express} */
const express = require('express');
/** @type {import('express').Router} */
const router = express.Router();


// TODO ADD THE ROUTE FILES
const appointmentRoutes = require('./appointments');
const calendarRoutes = require('./calendar');
const providerRoutes = require('./providers');

// Route map
router.use('/appointments', appointmentRoutes);
router.use('/calendar', calendarRoutes);
router.use('/providers', providerRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
