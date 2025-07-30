const supabase = require('../utils/supabaseClient');

//Check if user_id exists in zoom_tokens table
const checkExistingToken = (req, res, next) => {

}

//Check if user_id exists in zoom_users table
const checkExistingUser = (req, res, next) => {

} 

//Update token info based on user_id in zoom_tokens table
const updateToken = (req, res, next) => {

}

//Add new entry in zoom_tokens table
const addNewToken = async (req, res, next) => {
  try {
    const user_id = `test-user-${Date.now()}`;
    const access_token = "test";
    const refresh_token = "test";
    const token_type = "test";
    const expires_in = "3600";
    const scope = "read";
    const api_url = "https://api.zoom.us/v2/test";

    const { data, error } = await supabase
      .from('zoom_tokens')
      .insert([
        {
          user_id,
          access_token,
          refresh_token,
          token_type,
          expires_in,
          scope,
          api_url,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting new token:", error);
      return res.status(500).json({ error: "Failed to insert token data" });
    }

    return res.status(200).json({ message: "Token saved", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//Add new entry in zoom_users table 
const addNewUserInfo = (req, res, next) => {

}

//Get user info from zoom_users table
const getUser = () => {

}

module.exports = {
  checkExistingToken,
  checkExistingUser,
  updateToken,
  addNewToken,
  addNewUserInfo,
  getUser,
};