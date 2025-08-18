// backend/state.js
export let MEETING_ID = "";
export let CURRENT_USER_ID = "";

function setMeetingId(id) {
  MEETING_ID = id;
}

function setCurrentUserId(id) {
  CURRENT_USER_ID = id;
}

module.exports = {
  getMeetingId,
  setMeetingId,
  getCurrentUserId,
  setCurrentUserId,
};
