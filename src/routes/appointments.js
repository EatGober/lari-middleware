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
  transformAppointments, filterNullNums
} = require('../AppointUtils');

// Apply auth middleware to all appointment routes
router.use(authMiddleware);

// Get appointments with optional filtering
router.get('/:practiceid', asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    providerId,
    departmentId,
    maxDuration,
    startTime,
    endTime
  } = req.query;

  const { practiceid } = req.params;

  let appointments = await getAllAppointments(
    req.athenaToken,
    practiceid,
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
  const transformedAppointments = await Promise.all(
    await transformAppointments(appointments, practiceid, req.athenaToken)
  );

  const filteredAppts = filterNullNums(transformedAppointments)
  res.json(filteredAppts);
}));



module.exports = router;
