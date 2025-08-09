// backend/controllers/meetingController.js
const axios = require('axios');

exports.scheduleMeeting = async (req, res) => {
  try {
    const { userId, topic, startTime, agendaItems, items, timeZone } = req.body;

    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!req.zoomAccessToken) return res.status(401).json({ error: 'Missing Zoom access token' });
    if (!startTime) return res.status(400).json({ error: 'Missing startTime' });

    // Accept either `items` (array) or `agendaItems` (array or JSON string)
    let parsed = [];
    if (Array.isArray(items)) {
      parsed = items;
    } else if (Array.isArray(agendaItems)) {
      parsed = agendaItems;
    } else if (typeof agendaItems === 'string') {
      try { parsed = JSON.parse(agendaItems); } catch (_) { /* ignore parse errors */ }
    }

    const agendaText = (parsed || [])
      .map((it, i) => {
        const label = it.agenda_item || it.text || '';
        const mins = it.duration_seconds ? Math.round(it.duration_seconds / 60) : 0;
        return `${i + 1}. ${label}${mins ? ` — ${mins} min` : ''}`;
      })
      .join('\n');

    const payload = {
      topic: (topic || '').trim() || 'FlowMinder Meeting',
      type: 2, // scheduled
      start_time: new Date(startTime).toISOString(), // Zoom expects ISO UTC
      timezone: timeZone || undefined,
      agenda: agendaText || undefined,
      settings: {
        join_before_host: true,
        approval_type: 2,
        waiting_room: true,
        mute_upon_entry: true,
      },
    };

    const zoomRes = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      payload,
      {
        headers: {
          Authorization: `Bearer ${req.zoomAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.json({
      success: true,
      meetingId: zoomRes.data.id,
      start_url: zoomRes.data.start_url,
      join_url: zoomRes.data.join_url,
    });
  } catch (err) {
    return res
      .status(err?.response?.status || 500)
      .json(err?.response?.data || { error: 'Failed to create meeting' });
  }
};