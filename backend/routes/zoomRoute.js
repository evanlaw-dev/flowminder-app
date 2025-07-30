const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController.js');
const { exchangeCodeForToken, getZoomUserInfo } = require('../middleware/ZoomMiddleware.js');
const { addNewToken, deleteToken } = require('../middleware/tokenDataMiddleware.js');
const { addNewUserInfo } = require('../middleware/userDataMiddleware.js');

/**
 * Organizes all the routes associated with Zoom
 */

//get authorization code route
router.get('/oauth', zoomController.oauth);

//get authentication token route, save token, save user info, redirect to meeting page
router.get('/oauth/callback',
  exchangeCodeForToken,
  getZoomUserInfo,
  deleteToken,
  addNewToken,
  addNewUserInfo,
  zoomController.redirectToMeeting
);

module.exports = router;