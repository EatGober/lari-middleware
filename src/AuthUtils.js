require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

class AuthenticationError extends Error {
  constructor(message, statusCode, errorDetails) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}

/**
 * Retrieves an OAuth token from the Athena API
 * @param {Object} config - Configuration object
 * @param {string} config.clientId - Client ID for authentication
 * @param {string} config.clientSecret - Client Secret for authentication
 * @param {string} config.baseUrl - Base URL for the API (default: preview environment)
 * @param {string} config.scope - OAuth scope (default: athena/service/Athenanet.MDP.*)
 * @returns {Promise<string>} The OAuth access token
 * @throws {AuthenticationError} If authentication fails
 */
async function getAthenaToken({
                                clientId,
                                clientSecret,
                                baseUrl = 'https://api.preview.platform.athenahealth.com',
                                scope = 'athena/service/Athenanet.MDP.*'
                              } = {}) {
  // Validate required parameters
  if (!clientId || !clientSecret) {
    throw new Error('Client ID and Client Secret are required');
  }

  const tokenUrl = `${baseUrl}/oauth2/v1/token`;



  const requestConfig = {
    method: 'post',
    url: tokenUrl,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: clientId,
      password: clientSecret
    },
    data: qs.stringify({
      grant_type: 'client_credentials',
      scope: scope
    })
  };

  try {
    const response = await axios(requestConfig);
    console.log('Successfully retrieved OAuth token');
    return response.data.access_token;
  } catch (error) {
    const statusCode = error.response?.status;
    const errorDetails = error.response?.data;

    console.error('Failed to retrieve OAuth token:', {
      statusCode,
      errorMessage: error.message,
      errorDetails
    });

    throw new AuthenticationError(
      'Failed to retrieve OAuth token',
      statusCode,
      errorDetails
    );
  }
}



module.exports = {
  getAthenaToken,
  AuthenticationError
};
