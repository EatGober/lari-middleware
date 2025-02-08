// routes/appointments.js
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/error-handler');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllAppointments,
  filterAppointmentsByDuration,
  filterAppointmentsByEndTime,
  filterAppointmentsByStartTime,
  transformAppointments
} = require('../AppointUtils');

// Apply auth middleware to all appointment routes
router.use(authMiddleware);

// Get appointments with optional filtering
router.get('/:practiceId', asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    providerId,
    departmentId,
    maxDuration,
    startTime,
    endTime
  } = req.query;


  let appointments = await getAllAppointments(
    req.athenaToken,
    practiceId,
    startDate,
    endDate,
    providerId ? providerId.toString() : undefined,
    departmentId ? departmentId.toString() : undefined
  );

  if (maxDuration) {
    appointments = filterAppointmentsByDuration(
      appointments,
      parseInt(maxDuration)
    );
  }

  if (startTime) {
    appointments = filterAppointmentsByStartTime(
      appointments,
      new Date(startTime)
    );
  }

  if (endTime) {
    appointments = filterAppointmentsByEndTime(
      appointments,
      new Date(endTime)
    );
  }

  res.json(transformAppointments(appointments));
}));

module.exports = router;
