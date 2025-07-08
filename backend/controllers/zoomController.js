const { generateZoomAuthUrl } = require("../utils/oauth.js");

// OAuth: Build zoom auth url then redirect
const oauth = (req, res) => {
    const authUrl = generateZoomAuthUrl();
    res.redirect(authUrl);
}

module.exports = {
  oauth,
};