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

    // Zoom accepts two formats for start_time:
    // 1) "yyyy-MM-dd'T'HH:mm:ss'Z'" (UTC) and 2) "yyyy-MM-dd'T'HH:mm:ss" (local) + timezone
    // Send local time string + timezone to avoid server TZ ambiguity.
    // If coming from <input type="datetime-local"> it's usually "YYYY-MM-DDTHH:MM" (no seconds)
    const startLocal = (typeof startTime === 'string' && startTime.length === 16)
      ? `${startTime}:00`
      : startTime; // assume seconds present

    const payload = {
      topic: (topic || '').trim() || 'FlowMinder Meeting',
      type: 2, // scheduled
      start_time: startLocal, // local time string (no 'Z')
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
      topic: zoomRes.data.topic,
      start_time: zoomRes.data.start_time,
      timezone: zoomRes.data.timezone,
      start_url: zoomRes.data.start_url,
      join_url: zoomRes.data.join_url,
    });
  } catch (err) {
    return res
      .status(err?.response?.status || 500)
      .json(err?.response?.data || { error: 'Failed to create meeting' });
  }
};