const axios = require('axios');

// Request for token using temporary authorization code
const exchangeCodeForToken = async (req, res, next) => {
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
        res.locals[key] = tokens[key];
        console.log("Key: " + key + " Value: " + tokens[key] + "\n");
      }

      next();
    } catch (error) {

        console.error('OAuth callback error:', error.response?.data || error.message);
        res.status(500).json({ error: 'OAuth token exchange failed' });
        
    }
}

//get zoom user information based on access code
const getZoomUserInfo = async (req, res, next) => {

  const access_token = res.locals.access_token;

  try {
    const response = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log("Zoom User:", response.data);
    
  } catch (error) {
    console.error("Error fetching Zoom user information:", error.response?.data || error.message);
  }

  return res.redirect('http://localhost:4000');
}

module.exports = {
  exchangeCodeForToken,
  getZoomUserInfo,
};