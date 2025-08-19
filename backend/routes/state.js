// backend/routes/state.js
const express = require("express");
const router = express.Router();
const state = require("../config/state");

router.put("/meeting", (req, res) => {
  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  state.setMeetingId(id);   // <-- this is the actual call into state.js
  return res.json({ ok: true, meetingId: state.getMeetingId() });
});

module.exports = router;