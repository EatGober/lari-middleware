const axios = require('axios');
const {getPhone} = require('./PatientUtils')

/**
 * Retrieves appointments for the given date range and provider
 * @param {string} token - OAuth token thing
 * @param {string} practiceid - Practice ID
 * @param {string} startDate - Start date (MM/DD/YYYY)
 * @param {string} endDate - End date (MM/DD/YYYY)
 * @param {number} providerId - Provider ID
 * @param {number} departmentId - Department ID
 * @returns {Promise<Array>} Array of appointments
 */
async function getAllAppointments(token, practiceid, startDate, endDate, providerId, departmentId) {

  if (!token || !practiceid || !startDate || !endDate ) {
    throw new Error('Token, practiceid, startDate, and endDate are required');
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
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/booked`,
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
    throw new Error('Token, practiceid, appointmentId, and patientid are required');
  }


  try {
    const params = {
      appointmentid: appointmentid,
      patientid: patientid,
      practiceid: practiceid,
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
 * @param {number} practiceid - Practice ID
 * @param {string} bearerToken - Auth token
 * @param {string} [eventName] - Optional specific event to subscribe to
 * @returns {Promise} Subscription response
 */
const subscribeToChanges = async (practiceid, bearerToken, eventName) => {
  const formData = new URLSearchParams();

  if(eventName) formData.append('eventname', eventName);

  const response = await fetch(
    `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/changed/subscription`,
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
 * @param {number} practiceid
 * @param {string} bearerToken
 * @returns {Promise} Current subscriptions and their status
 */
const getSubscriptions = async (practiceid, bearerToken) => {
  const response = await fetch(
    `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/changed/subscription`,
    {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    }
  );

  if(!response.ok) throw new Error(`Failed to get subscriptions: ${response.statusText}`);
  return response.json();
};




/**
 * Transforms full appointment objects into a streamlined format
 * @param {Array} appointments - Array of full appointment objects
 * @param practiceid - ID of practice
 * @param token - String
 * @returns {Array} Array of streamlined appointment objects
 *
 */
const transformAppointments = async (appointments,practiceid, token) => {
  if (!Array.isArray(appointments)) {
    throw new Error('Input must be an array of appointments');
  }

  return appointments.map(async appointment => {
    // Ensure all required fields exist
    if (!appointment.appointmentid || !appointment.patientid ||
      !appointment.departmentid || !appointment.providerid) {
      throw new Error('Missing required appointment fields');
    }

    // Convert ID fields to integers
    const appointmentId = parseInt(appointment.appointmentid, 10);
    const patientId = parseInt(appointment.patientid, 10);
    const departmentId = parseInt(appointment.departmentid, 10);
    const providerId = parseInt(appointment.providerid, 10);
    console.log("TransformAppt - practiceid", practiceid);
    console.log("TransformAppt - patientid", appointment.patientid);
    const patientPhone = await getPhone(token, practiceid, appointment.patientid);
    console.log("patientPhone", patientPhone);

    // Validate ID conversions
    if (isNaN(appointmentId) || isNaN(patientId) ||
      isNaN(departmentId) || isNaN(providerId)) {
      throw new Error('Invalid ID format in appointment data');
    }

    // TODO: Implementation note - patientPhone and providerName would need to be
    // retrieved from additional API calls or data sources as they're not in the
    // original appointment object

    return {
      appointmentid: appointmentId,
      patientid: patientId,
      departmentid: departmentId,
      providerid: providerId,
      patientPhone: patientPhone, // Dummy phone number
      providerName: "Dr. Smith", // Dummy provider name
      scheduledDateTimeString: appointment.scheduleddatetime || null,
      duration: parseInt(appointment.duration, 10) || 0
    };
  });
}

module.exports = { getAllAppointments, filterAppointmentsByDuration, filterAppointmentsByEndTime, filterAppointmentsByStartTime, transformAppointments, cancelAppointment };
