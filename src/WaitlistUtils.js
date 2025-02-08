const axios = require('axios');
const { getBatchPatient } = require('./PatientUtils');

const getWaitlist = async (token, practiceid,departmentid) => {
  if (!token || !practiceid) {
    throw new Error("token and practice id are required for getWaitlist");
  }

  try {
    const params = {
      practiceid: practiceid
    };

    if (departmentid) {
      params.providerid = departmentid;
    }

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
    return response.data.waitlistentries || response.data.results || [];

  } catch (error) {
    console.error('Failed to retrieve waitlist appts:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
};

module.exports = {
  getWaitlist
};
