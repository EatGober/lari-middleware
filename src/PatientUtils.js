const axios = require('axios');
const {get} = require("axios");

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
  if (!token || !practiceid || !patientids?.length) {
    throw new Error('Token, practiceid, and patientids are required');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: `https://api.preview.platform.athenahealth.com/v1/${practiceid}/patients`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        patientidlist: Array.isArray(patientids) ? patientids.join(',') : patientids
      }
    });

    // Extract the patients array from the response
    if (response.data && response.data.patients) {
      return response.data.patients;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // If it's a single patient object, wrap it in an array
      return [response.data];
    }

    return [];
  } catch (error) {
    console.error('Failed to search patients:', {
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
}

async function getPhones(token, practiceid, patientIds) {
  if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
    return {};
  }

  try {
    // Use batch endpoint if multiple patients, single endpoint if just one
    const patientData = patientIds.length > 1
      ? await getBatchPatients(token, practiceid, patientIds)
      : [await getPatient(token, practiceid, patientIds[0])];

    // Create a map of patient ID to phone number
    const result = {};
    patientData.forEach(patient => {
      if (patient && patient.patientid) {
        const phone = extractPhoneFromPatient(patient);
        if (phone) {
          result[patient.patientid] = phone;
        }
      }
    });

    // Debug logging
    console.log('Phone mapping results:', {
      totalPatients: patientData.length,
      patientsWithPhones: Object.keys(result).length,
      phoneMap: result
    });

    return result;
  } catch (error) {
    console.error('Failed to get patient phones:', error);
    return {};
  }
}

function extractPhoneFromPatient(patient) {
  if (!patient) return null;

  // Debug logging for phone fields
  console.log(`Extracting phone for patient ${patient.patientid}:`, {
    contactMobile: patient.contactmobilephone,
    mobile: patient.mobilephone,
    home: patient.homephone
  });

  // Try contact mobile first
  if (patient.contactmobilephone) {
    return patient.contactmobilephone;
  }
  // Then try regular mobile
  if (patient.mobilephone) {
    return patient.mobilephone;
  }
  // Finally try home phone
  if (patient.homephone) {
    return patient.homephone;
  }

  return null;
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
module.exports = {getPatient,getPhone, getPhones};
