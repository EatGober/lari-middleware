const axios = require('axios');
const {get} = require("axios");
const {getAthenaToken} = require("./AuthUtils");

/**
 * Gets a patient's raw obj from athenahealth
 * * @param token
 * @param {string} practiceid
 * @param {string}patientid
 * @returns {Promise<Array>} Array of patient objects
 */
async function getPatient(token, practiceid, patientid) {
  if (!token || !practiceid || !patientid) {
    throw new Error('Token, practiceid, patientid are required');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/patients/${patientid}`,
      params: {
        practiceid: practiceid,
        patientid: patientid,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data || [];

  } catch (error) {
    console.error('Failed to retrieve patient:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
}

const getPhone = async ( practiceid, patientid) => {


  try {

    const token = await getAthenaToken({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    })
    const response = await getPatient(token, practiceid, patientid);


    // Handle case where response is an array
    const patient = Array.isArray(response) ? response[0] : response;

    if (!patient) {
      console.log('No patient data found');
      return null;
    }

    // Check if patient has opted out of texting
    // if (!patient.consenttotext) {
    //   return null;
    // }

    if (patient.contactmobilephone) {
      return patient.contactmobilephone;
    } else if (patient.mobilephone) {
      return patient.mobilephone;
    } else if (patient.homephone) {
      return patient.homephone;
    }

    return null;
  } catch (error) {
    console.error('Failed to get patient phone:', error);
    return null;
  }
}
module.exports = {getPatient,getPhone};
