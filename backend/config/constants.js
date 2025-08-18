let MEETING_ID = "";
let CURRENT_USER_ID = "";

function getMeetingId() {
  return MEETING_ID;
}
function setMeetingId(id) {
  MEETING_ID = id || "";
  console.log("[state] meeting id set:", MEETING_ID);
}
function getCurrentUserId() {
  return CURRENT_USER_ID;
}
function setCurrentUserId(id) {
  CURRENT_USER_ID = id || "";
  console.log("[state] user id set:", CURRENT_USER_ID);
}

module.exports = {
  getMeetingId,
  setMeetingId,
  getCurrentUserId,
  setCurrentUserId,
};
