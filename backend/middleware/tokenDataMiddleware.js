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
const addNewToken = (req, res, next) => {

}

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