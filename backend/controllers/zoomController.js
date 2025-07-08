const { generateZoomAuthUrl } = require("../utils/oauth.js");
const axios = require('axios');

// OAuth: Build zoom auth url then redirect
const oauth = (req, res) => {
    const authUrl = generateZoomAuthUrl();
    res.redirect(authUrl);
}

// Request for token using temporary authorization code
const oauthCallback = async (req, res) => {
    console.log('OAuth callback triggered');
    const code = req.query.code;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
    }

    try {
      const tokenResponse = await axios.post('https://zoom.us/oauth/token', null, {
          params: {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
          },
          auth: {
            //Providing app credential to get token
            username: process.env.ZOOM_CLIENT_ID,
            password: process.env.ZOOM_CLIENT_SECRET,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
      });

      const tokens = tokenResponse.data;
      
      //Log returned tokens
      for (const key in tokens) {
        console.log("Key: " + key + " Value: " + tokens[key]);
      }

      res.status(200).json({ message: 'OAuth success', tokens });
    } catch (error) {

        console.error('OAuth callback error:', error.response?.data || error.message);
        res.status(500).json({ error: 'OAuth token exchange failed' });
        
    }
}
 
module.exports = {
  oauth,
  oauthCallback,
};