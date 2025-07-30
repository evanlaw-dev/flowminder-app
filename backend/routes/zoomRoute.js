const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController.js');
const { exchangeCodeForToken, getZoomUserInfo } = require('../middleware/zoomMiddleware.js');

/**
 * Organizes all the routes associated with Zoom
 */

//get authorization code route
router.get('/oauth', zoomController.oauth);

//get authentication token route
//need to pass along to middleware for saving into DB and redirect, adding session, and redirect to frontend
router.get('/oauth/callback',
  exchangeCodeForToken,
  getZoomUserInfo
);

module.exports = router;