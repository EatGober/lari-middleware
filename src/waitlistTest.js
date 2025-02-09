// test-waitlist.js
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

async function testWaitlistAPI() {
  try {
    // API base URL
    const baseURL = process.env.API_URL || 'http://localhost:3000/api';

    // Test parameters
    const practiceid = process.env.PRACTICE_ID || '195900';
    const providerId = 71;
    const departmentId = 1;
    console.log('Waitlist API Test Configuration:');
    console.log('----------------------');
    console.log(`Base URL: ${baseURL}`);
    console.log(`Practice ID: ${practiceid}`);
    if (providerId) console.log(`Provider ID: ${providerId}`);

    // Construct query parameters
    const params = {};
    if (providerId) {
      params.departmentid = departmentId;
    }

    // Test waitlist fetch
    const testUrl = `${baseURL}/waitlist/${practiceid}`;
    console.log('\nMaking request to:', testUrl);
    console.log('With params:', params);

    const response = await axios.get(testUrl, { params });

    console.log('\nResponse:');
    console.log(`Status: ${response.status}`);
    console.log(`Found ${response.data.length} waitlist entries`);

    if (response.data.length > 0) {
      console.log('\nSample waitlist entry:');
      console.log(JSON.stringify(response.data[0], null, 2));
      // Write all waitlist entries to a JSON file
      fs.writeFileSync('waitlist.json', JSON.stringify(response.data, null, 2));
      console.log('\nAll waitlist entries have been written to waitlist.json');
    }

  } catch (error) {
    console.error('\nTest failed:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    process.exit(1);
  }
}

testWaitlistAPI();
