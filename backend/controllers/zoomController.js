const { generateZoomAuthUrl } = require("../utils/oauth.js");

// auth 
const oauth = (req, res) => {
    const authUrl = generateZoomAuthUrl();

    res.redirect(authUrl);
}

module.exports = {
  oauth,
};