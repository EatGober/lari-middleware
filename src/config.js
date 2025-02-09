// src/config/athena.js
require('dotenv').config();

module.exports = {
  practiceId: 1,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  backendUrl: process.env.BACKEND_URL || 'http://23.137.104.16:3001/update',
  pollInterval: parseInt(process.env.ATHENA_POLL_INTERVAL) || 60000
};
