const axios = require('axios');
const { getBatchPatient } = require('./PatientUtils');

const getWaitlist = async (token, practiceid, providerid) => {
  if (!token || !practiceid) {
    throw new Error("token and practice id are required for getWaitlist");
  }

  try {
    const params = {
      practiceid: practiceid
    };
    if (providerid) {
      params.providerid = providerid;
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

    return response.data;
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
