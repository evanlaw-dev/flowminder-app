const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController.js');

/**
 * Organizes all the routes associated with Zoom
 */

//get authorization code route
router.get('/oauth', zoomController.oauth);

//get authentication token route
router.get('/oauth/callback', zoomController.oauthCallback);

module.exports = router;