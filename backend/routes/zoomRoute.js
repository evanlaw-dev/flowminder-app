import express from 'express';
const router = express.Router();
import zoomController from '../controllers/zoomController.js';

/**
 * Organizes all the routes associated with Zoom
 */

//get authenication token route
router.get('\auth', zoomController.oauth);

export default router;