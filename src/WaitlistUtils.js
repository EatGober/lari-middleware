const axios = require('axios');
const { getBatchPatient } = require('./PatientUtils');
const {transformAppointments, getAllAppointments,parseDateTime} = require("./AppointUtils");
const _ = require('lodash');  // Add this import

const getWaitlist = async (token, practiceid,departmentid, providerid) => {
  if (!token || !practiceid) {
    throw new Error("token and practice id are required for getWaitlist");
  }

  try {
    const params = {
    };

    if (departmentid) {
      params.departmentid = departmentid;
    }
    if (providerid) {
      params.providerid = providerid;
    }
    console.log('\nMaking Athena API request with params:', params);

    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/appointments/waitlist`,
      params: params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Add logging to see the structure
    console.log('Waitlist response structure:', JSON.stringify(response.data, null, 2));

    // Return the waitlist array, similar to how appointments are handled
    return response.data.waitlistentries || [];

  } catch (error) {
    console.error('Failed to retrieve waitlist appts:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
};



/**
 * Enhances waitlist entries for a specific department with appointment information
 * @param {Array} waitlistData - Array of waitlist entries
 * @param {string} token - Authentication token
 * @param {string} practiceId - Practice ID
 * @param {number} targetDepartmentId - Department ID to filter for
 * @returns {Promise<Array>} Enhanced waitlist entries for the specified department
 */
async function enhanceWaitlistWithAppointments(waitlistData, token, practiceId, targetDepartmentId=1) {
  if (!Array.isArray(waitlistData)) {
    throw new Error('waitlistData must be an array');
  }

  try {
    // Filter for only the target department entries
    const departmentEntries = waitlistData.filter(entry => entry.departmentid === targetDepartmentId);

    // Group by providerId for efficient API calls
    const groupedByProvider = _.groupBy(departmentEntries, 'providerid');
    const enhancedEntries = [];

    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Process each provider group
    for (const [providerId, entries] of Object.entries(groupedByProvider)) {
      try {
        // Get appointments for this provider
        const appointments = await getAllAppointments(
          token,
          practiceId,
          today.toISOString(),
          thirtyDaysFromNow.toISOString(),
          providerId !== 'undefined' ? parseInt(providerId) : undefined,
          targetDepartmentId
        );

        // Transform the appointments
        const transformedAppointments = await transformAppointments(
          appointments,
          practiceId,
          token
        );

        // Enhance each entry with appointment data
        entries.forEach(entry => {
          const enhancedEntry = {
            ...entry,
            relatedAppointments: transformedAppointments.filter(appt =>
              appt.patientid === entry.patientid
            ),
            patientPhone: transformedAppointments[0]?.patientPhone || '+19194751339',
            providerName: transformedAppointments[0]?.providerName || 'Dr. Geoffrey Fox',
            scheduleDateTimeString: transformedAppointments[0]?.scheduleddatetime
              ? parseDateTime(transformedAppointments[0].scheduleddatetime)
              : new Date().toISOString()
          };
          enhancedEntries.push(enhancedEntry);
        });
      } catch (error) {
        console.error(`Failed to process entries for provider ${providerId}:`, error);
      }
    }

    return enhancedEntries;
  } catch (error) {
    console.error('Error enhancing waitlist data:', error);
    throw error;
  }
}





module.exports = {
  getWaitlist,
  enhanceWaitlistWithAppointments
};
