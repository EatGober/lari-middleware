require('dotenv').config();
const { getAthenaToken } = require("./AuthUtils");
const { getAllAppointments, filterAppointmentsByStartTime } = require("./AppointUtils");

async function main() {
  try {
    const token = await getAthenaToken({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    });
    console.log('Successfully obtained token');

    const practiceId = process.env.PRACTICE_ID;
    const providerId = process.env.PROVIDER_ID;

    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    console.log(`Date: ${d}`);
    const n = new Date();
    const startDate = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const endDate = n.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    console.log(`Fetching appointments from ${startDate} to ${endDate}`);
    console.log(`Practice ID: ${practiceId}`);
    console.log(`Provider ID: ${providerId}`);



    const appointments = await getAllAppointments(
      token,
      practiceId,
      startDate,
      endDate,
      providerId
    );

    if (!appointments || appointments.length === 0) {
      console.log('No appointments found. This could mean either:');
      console.log('1. There are no appointments in this date range');
      console.log('2. The practice ID or provider ID might be incorrect');
      console.log('3. The API endpoint might be in test mode with no test data');
      return;
    }

    console.log(`Found ${appointments.length} appointments`);
    console.log('First appointment:', JSON.stringify(appointments[0], null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
}

main();
