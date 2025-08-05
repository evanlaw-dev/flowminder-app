const router = require('express').Router();
const { scheduleMeeting } = require('../controllers/meetingController');

// POST /api/meetings/schedule
router.post('/schedule', scheduleMeeting);

module.exports = router;