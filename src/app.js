// app.js
require('dotenv').config();

const express = require('express');
const routes = require('./routes');
const { authMiddleware } = require('./middleware/auth');
const AthenaPollingService = require('./services/AthenaPollingService');
const athenaConfig = require('./config');

const app = express();





// Basic middleware
app.use(express.json());
// app.use('/api', authMiddleware);


// Mount routes
app.use('/api', routes);
const pollingService = new AthenaPollingService(athenaConfig);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and accessible from any IP`);

  pollingService.start()
    .catch(error => {
      console.error('Failed to start Athena polling service:', error);
    });
});

const shutdown = () => {
  console.log('Shutting down server...');
  pollingService.stop();
  server.close(() => {
    console.log('Server shut down complete');
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
