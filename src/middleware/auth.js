// middleware/auth.js
const { getAthenaToken } = require('../AuthUtils');

// Simple token cache
let token = null;
let tokenExpiry = null;

const authMiddleware = async (req, res, next) => {
  try {
    // If token exists and isn't expired (with 5 min buffer), use it
    if (token && tokenExpiry && (tokenExpiry.getTime() - Date.now() > 300000)) {
      req.athenaToken = token;
    } else {
      // Get new token
      token = await getAthenaToken({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
      });
      tokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
      req.athenaToken = token;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = { authMiddleware };
