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

/**
 * Returns a batch of patient records from athenahealth as an array
 * @param token - String
 * @param practiceid - practice id
 * @param patientids - Comma seperated string of patient ids
 * @returns {Promise<Array>} Array of patient objects
 */

async function getBatchPatients(token, practiceid, patientids) {
  if (!token || !practiceid || !patientids) {
    throw new Error('Token, practiceid, patientids are required');
  }
  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/patients/batch`,
      params: {
        practiceid: practiceid,
        patientids: patientids,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data || [];
  }catch (error) {
    console.error('Failed to retrieve patients:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
}


const getPhone = async (token, practiceid, patientid) => {

  try {

    
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
