// backend/state.js
export let MEETING_ID = "";
export let CURRENT_USER_ID = "";

function setMeetingId(id) {
  MEETING_ID = id;
  console.log("meeting id from console " + MEETING_ID);
}

function setCurrentUserId(id) {
  CURRENT_USER_ID = id;
    console.log("meeting id from console" + MEETING_ID);

}

module.exports = {
  getMeetingId,
  setMeetingId,
  getCurrentUserId,
  setCurrentUserId,
};
