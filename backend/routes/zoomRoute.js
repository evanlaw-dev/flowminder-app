const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController.js');
const { exchangeCodeForToken, getZoomUserInfo } = require('../middleware/ZoomMiddleware.js');
const { addNewToken } = require('../middleware/tokenDataMiddleware.js');
const supabase = require('../utils/supabaseClient');

/**
 * Organizes all the routes associated with Zoom
 */

//get authorization code route
router.post('/oauth', zoomController.oauth);

//get authentication token route
//need to pass along to middleware for saving into DB and redirect, adding session, and redirect to frontend
router.get('/oauth/callback',
  exchangeCodeForToken,
  getZoomUserInfo
);

router.post('/token', 
  addNewToken,
);

module.exports = router;