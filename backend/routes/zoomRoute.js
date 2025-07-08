const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController.js');

/**
 * Organizes all the routes associated with Zoom
 */

//get authenication token route
router.get('/oauth', zoomController.oauth);

module.exports = router;