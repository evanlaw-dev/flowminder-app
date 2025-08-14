// backend/controllers/zoomController.js

const { generateZoomAuthUrl } = require("../utils/oauth.js");
const axios = require('axios');

// OAuth: Build zoom auth url then redirect
const oauth = (req, res) => {
    const authUrl = generateZoomAuthUrl();
    res.redirect(authUrl);
}

const redirectToMeeting = (req, res) => {
  // return res.redirect(`http://localhost:3000/meeting/${res.locals.zoomUser.id}`);
  return res.redirect(`${process.env.FRONTEND_REDIRECT_URI}/meeting/${res.locals.zoomUser.id}`);
}
  
module.exports = {
  oauth,
  redirectToMeeting
};