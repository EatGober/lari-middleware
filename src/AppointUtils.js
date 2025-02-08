const axios = require('axios');

/**
 * Retrieves appointments for the given date range and provider
 * @param {string} token - OAuth token
 * @param {string} practiceId - Practice ID
 * @param {string} startDate - Start date (MM/DD/YYYY)
 * @param {string} endDate - End date (MM/DD/YYYY)
 * @param {number} providerId - Provider ID
 * @param {number} departmentId - Department ID
 * @returns {Promise<Array>} Array of appointments
 */
async function getAllAppointments(token, practiceId, startDate, endDate, providerId, departmentId) {

  if (!token || !practiceId || !startDate || !endDate ) {
    throw new Error('Token, practiceId, startDate, and endDate are required');
  }

  if (!providerId && !departmentId) {
    throw new Error('Either providerId or departmentId must be provided');
  }

  try {
    const params = {
      startdate: startDate,
      enddate: endDate,
      limit: 1000
    };

    if (providerId) {
      params.providerid = providerId;
    }

    if (departmentId) {
      params.departmentid = departmentId;
    }

    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceId}/appointments/booked`,
      params: params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data.appointments || [];

  } catch (error) {
    console.error('Failed to retrieve appointments:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
}

/**
 * Converts mm/dd/yyyy hh24:mi:ss string to Date object
 * @param {string} dateTimeString - Date string in format "mm/dd/yyyy hh24:mi:ss"
 * @returns {Date} Parsed date object
 */
const parseDateTime = (dateTimeString) => {
  const [datePart, timePart] = dateTimeString.split(' ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');

  return new Date(
    parseInt(year),
    parseInt(month) - 1, // months are 0-based in JS
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
};


/**
 * Filters an array of appointment objects by maximum duration
 * @param {Array<Object>} appointments - Array of appointment objects
 * @param {number} maxDuration - Maximum duration in minutes to filter by
 * @returns {Array<Object>} Filtered array of appointments with duration < maxDuration
 */
const filterAppointmentsByDuration = (appointments, maxDuration) => {
  if (!Array.isArray(appointments)) {
    throw new TypeError('Appointments must be an array');
  }


  return appointments.filter(appointment =>
    appointment?.duration &&
    typeof appointment.duration === 'number' &&
    appointment.duration < maxDuration
  );
};


/**
 * Filters appointments by start time
 * @param {Array} appointments - Array of appointment objects
 * @param {Date} startTime - Start time to filter by
 * @returns {Array} Filtered appointments
 */
const filterAppointmentsByStartTime = (appointments, startTime) => {
  if (!Array.isArray(appointments)) {
    throw new Error('appointments must be an array');
  }

  if (!(startTime instanceof Date)) {
    throw new Error('startTime must be a Date object');
  }

  return appointments.filter(appointment => {
    const scheduledDateTime = parseDateTime(appointment.scheduledDateTimeString);
    return scheduledDateTime >= startTime;
  });
};


/**
 * Filters appointments by end time
 * @param {Array} appointments - Array of appointment objects
 * @param {Date} endTime - End time to filter by
 * @returns {Array} Filtered appointments
 */
const filterAppointmentsByEndTime = (appointments, endTime) => {
  if (!Array.isArray(appointments)) {
    throw new Error('appointments must be an array');
  }

  if (!(endTime instanceof Date)) {
    throw new Error('endTime must be a Date object');
  }

  return appointments.filter(appointment => {
    const scheduledDateTime = parseDateTime(appointment.scheduledDateTimeString);
    return scheduledDateTime <= endTime;
  });
};

// TODO reschedule appointment, get appt slots, Subscribe to appt changes and post to Go server

/**
 * Cancels an appointment
 * @param token
 * @param {int} practiceid
 * @param {int} appointmentid
 * @param {int}patientid
 * @param {String} reason
 * @returns {Promise<*>}
 */

const cancelAppointment = async (token, practiceid, appointmentid,patientid,reason) => {
  if (!token || !practiceid || !appointmentid || !patientid) {
    throw new Error('Token, practiceId, appointmentId, and patientid are required');
  }


  try {
    const params = {
      appointmentid: appointmentid,
      patientid: patientid,
      practiceId: practiceid,
    };
    if (reason) {
      params.reason = reason;
    }
    const response = await axios({
      method: 'put',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/${appointmentid}/cancel`,
      params: params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return response.data.status;
  } catch (error) {
    console.error(`Failed to cancel appointment ${appointmentid}:`, {
      status: error.response?.status,
      message: error.message
    });
  }
}



/**
 * Subscribes to appointment change events
 * @param {number} practiceId - Practice ID
 * @param {string} bearerToken - Auth token
 * @param {string} [eventName] - Optional specific event to subscribe to
 * @param {boolean} [includeReminderCall] - Include reminder call events
 * @param {boolean} [includeSuggestedOverbooking] - Include overbooking events
 * @returns {Promise} Subscription response
 */
const subscribeToChanges = async (practiceId, bearerToken, eventName) => {
  const formData = new URLSearchParams();

  if(eventName) formData.append('eventname', eventName);

  const response = await fetch(
    `https://api.preview.platform.athenahealth.com/v1/${practiceId}/appointments/changed/subscription`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    }
  );

  if(!response.ok) throw new Error(`Subscription failed: ${response.statusText}`);
  return response.json();
};

/**
 * Get current appointment change subscriptions
 * @param {number} practiceId
 * @param {string} bearerToken
 * @returns {Promise} Current subscriptions and their status
 */
const getSubscriptions = async (practiceId, bearerToken) => {
  const response = await fetch(
    `https://api.preview.platform.athenahealth.com/v1/${practiceId}/appointments/changed/subscription`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    }
  );

  if(!response.ok) throw new Error(`Failed to get subscriptions: ${response.statusText}`);
  return response.json();
};

module.exports = { getAllAppointments, filterAppointmentsByDuration, filterAppointmentsByEndTime, filterAppointmentsByStartTime };
