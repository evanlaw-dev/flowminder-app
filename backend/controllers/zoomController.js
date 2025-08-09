// backend/controllers/zoomController.js
const axios = require('axios');
const ZOOM_BASE = 'https://api.zoom.us/v2';

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

const { generateZoomAuthUrl } = require("../utils/oauth.js");

// ------- existing stuff you had -------
const oauth = (req, res) => {
  const authUrl = generateZoomAuthUrl();
  res.redirect(authUrl);
};

const redirectToMeeting = (req, res) => {
  return res.redirect(
    `${process.env.FRONTEND_REDIRECT_URI}/meeting/${res.locals.zoomUser.id}`
  );
};

// ---------- Zoom Scheduler controllers ----------
const listSchedules = async (req, res) => {
  try {
    const { from, to, page_size, next_page_token, show_deleted, time_zone } = req.query;
    const { data } = await axios.get(`${ZOOM_BASE}/scheduler/schedules`, {
      headers: authHeaders(req.zoomAccessToken),
      params: { from, to, page_size, next_page_token, show_deleted, time_zone },
    });
    res.json(data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { message: 'zoom listSchedules failed' });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { data } = await axios.get(`${ZOOM_BASE}/scheduler/schedules/${scheduleId}`, {
      headers: authHeaders(req.zoomAccessToken),
    });
    res.json(data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { message: 'zoom getSchedule failed' });
  }
};

const listEvents = async (req, res) => {
  try {
    const { from, to, page_size, next_page_token, show_deleted, time_zone, event_type, search } = req.query;
    const { data } = await axios.get(`${ZOOM_BASE}/scheduler/events`, {
      headers: authHeaders(req.zoomAccessToken),
      params: { from, to, page_size, next_page_token, show_deleted, time_zone, event_type, search },
    });
    res.json(data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { message: 'zoom listEvents failed' });
  }
};

const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { data } = await axios.get(`${ZOOM_BASE}/scheduler/events/${eventId}`, {
      headers: authHeaders(req.zoomAccessToken),
    });
    res.json(data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { message: 'zoom getEvent failed' });
  }
};

const createSingleUseLink = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { data } = await axios.post(`${ZOOM_BASE}/scheduler/schedules/single_use_link`,
      { schedule_id: scheduleId },
      { headers: authHeaders(req.zoomAccessToken) }
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(err?.response?.status || 500).json(err?.response?.data || { message: 'zoom singleUseLink failed' });
  }
};

// Create a Scheduler schedule (event type)
const createSchedule = async (req, res) => {
  try {
    const { data } = await axios.post(
      `${ZOOM_BASE}/scheduler/schedules`,
      req.body,
      { headers: authHeaders(req.zoomAccessToken) }
    );
    res.status(201).json(data);
  } catch (err) {
    res
      .status(err?.response?.status || 500)
      .json(err?.response?.data || { message: 'zoom createSchedule failed' });
  }
};

module.exports = {
  oauth,
  redirectToMeeting,
  listSchedules,
  getSchedule,
  listEvents,
  getEvent,
  createSingleUseLink,
  createSchedule,
};