// app.js
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', routes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
