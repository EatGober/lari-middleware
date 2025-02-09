const axios = require('axios');
const {getPhones} = require('./PatientUtils')

/**
 * Retrieves appointments for the given date range and provider
 * @param {string} token - OAuth token thing
 * @param {string} practiceid - Practice ID
 * @param {string} startDate - Start date ISO Date string
 * @param {string} endDate - End date ISO Date string
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
      startdate: convertISOToDate(startDate),
      enddate: convertISOToDate(endDate),
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
 * Retrieves multiple appointments from athenahealth API by their appointment IDs.
 *
 * @async
 * @param {string} token - The authentication token for API access
 * @param {string|number} practiceid - The practice ID
 * @param {Array<number>} appointmentIds - Array of appointment IDs to retrieve
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of appointment objects
 *
 * @throws {Error} If token, practiceid, or appointmentIds are missing
 * @throws {Error} If the API request fails
 *
 */
async function getAppointmentsByIds(token, practiceid, appointmentIds) {
  // Input validation
  if (!token || !practiceid || !appointmentIds || !appointmentIds.length) {
    throw new Error('Token, practiceid, and at least one appointmentId are required');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/booked/multiple`,
      params: {
        appointmentids: appointmentIds.join(',')
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data.appointments || [];

  } catch (error) {
    console.error('Failed to retrieve appointments by IDs:', {
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
 * Converts Date object to mm/dd/yyyy hh24:mi:ss string format
 * @param {Date} dateObj - Date object to convert
 * @returns {string} Formatted date string in "mm/dd/yyyy hh24:mi:ss" format
 */
const formatDumbDateTime = (dateObj) => {
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Add 1 since months are 0-based
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Converts an ISO date string to mm/dd/yyyy string format
 * @param {string} isoDateString - ISO date string (e.g., "2023-10-15T14:48:00.000Z")
 * @returns {string} Formatted date string in "mm/dd/yyyy" format
 */
function convertISOToDate(isoDateString) {
  const date = new Date(isoDateString);

  // Use UTC methods to avoid timezone issues
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Add 1 since months are 0-based
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${month}/${day}/${year}`;
}

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
    const scheduledDateTime = parseDateTime(appointment.scheduleddatetime);
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
    const scheduledDateTime = parseDateTime(appointment.scheduleddatetime);
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

const cancelAppointment = async (token, practiceid, appointmentid, patientid, reason) => {
  if (!token || !practiceid || !appointmentid || !patientid) {
    throw new Error('Token, practiceid, appointmentId, and patientid are required');
  }

  try {
    const requestBody = new URLSearchParams();
    requestBody.append('patientid', patientid);
    if (reason) {
      requestBody.append('cancellationreason', reason);
    }
    // Add optional parameters with default values
    requestBody.append('ignoreschedulablepermission', 'true');
    requestBody.append('nopatientcase', 'false');

    const response = await axios({
      method: 'PUT',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/${appointmentid}/cancel`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: requestBody
    });

    console.log('Cancel request details:', {
      url: response.config.url,
      headers: response.config.headers,
      data: response.config.data,
      response: response.data
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to cancel appointment ${appointmentid}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: error.config?.data
    });
    throw error;
  }
};



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
 * @param {string} practiceid - ID of practice
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} Array of streamlined appointment objects
 */
const transformAppointments = async (appointments, practiceid, token) => {
  if (!Array.isArray(appointments)) {
    throw new Error('Input must be an array of appointments');
  }

  try {
    // Extract unique patient IDs
    const patientIds = [...new Set(appointments
      .filter(appt => appt.patientid)
      .map(appt => parseInt(appt.patientid, 10)))];

    // Get all phone numbers in one batch call using just the patient IDs
    const phoneNumbersByPatientId = await getPhones(token, practiceid, patientIds);

    // Process all appointments
    return appointments.map(appointment => {
      // Ensure all required fields exist
      if (!appointment.appointmentid || !appointment.patientid ||
        !appointment.departmentid || !appointment.providerid) {
        throw new Error('Missing required appointment fields');
      }

      // Convert ID fields to integers
      const appointmentId = parseInt(appointment.appointmentid, 10);
      const patientid = parseInt(appointment.patientid, 10);
      const departmentId = parseInt(appointment.departmentid, 10);
      const providerId = parseInt(appointment.providerid, 10);
      const scheduledDateTimeString = parseDateTime(appointment.scheduleddatetime)

      // Validate ID conversions
      if (isNaN(appointmentId) || isNaN(patientid) ||
        isNaN(departmentId) || isNaN(providerId)) {
        throw new Error('Invalid ID format in appointment data');
      }

      return {
        appointmentid: appointmentId,
        patientid: patientid,
        departmentid: departmentId,
        providerid: providerId,
        patientPhone: phoneNumbersByPatientId[patientid] || null,
        providerName: "Dr. Smith", // Dummy provider name
        scheduledDateTimeString: scheduledDateTimeString || null,
        duration: parseInt(appointment.duration, 10) || 0
      };
    });

  } catch (error) {
    console.error('Error transforming appointments:', error);
    throw error;
  }
};
/**
 *
 * @param transformedAppt - an array of tranfoormed appt objects
 */
const filterNullNums = (transformedAppt)=>{
  if (!Array.isArray(transformedAppt)) {
    throw new Error('Input must be an array of appointments');
  }
  let numOnly = []
  transformedAppt.forEach( (appt) =>{
    if (appt.patientPhone != null){
      numOnly.push(appt)
    }
  })
  return numOnly;
};




module.exports = { getAllAppointments, getAppointmentsByIds,parseDateTime,  filterAppointmentsByDuration, getSubscriptions, subscribeToChanges, filterAppointmentsByEndTime, filterAppointmentsByStartTime, transformAppointments, cancelAppointment,filterNullNums };
