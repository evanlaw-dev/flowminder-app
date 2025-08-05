const axios = require('axios');
const { getStoredZoomTokenFor } = require('../utils/oauth');
// …and any DB helpers you need

exports.scheduleMeeting = async (req, res) => {
  const { userId, topic, startTime, agendaItems } = req.body;
  // 1) fetch Zoom token for userId
  getStoredZoomTokenFor(userId)

  // 2) format agendaItems into a string
  const items = JSON.parse(agendaItems);

  // 3) format agendaItems into a string
  const agendaText = items
  .map((it,i) => `${i+1}. ${it.agenda_item} — ${it.duration_seconds/60} min`)
  .join('\n');

  // 4) call zoom creat meeting api:
  const zoomRes = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    { topic, type: 2, start_time: new Date(startTime).toISOString(), agenda: agendaText },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // 5) return zoomRes.data.id
    res.json({ success: true, meetingId: zoomRes.data.id });
    
};