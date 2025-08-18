async function getOrCreateMeetingId(pool, {
  zoom_meeting_id,
  host_email = null,
  meeting_title = null,
  scheduled_start = null
}) {
  // 1) Try to find an existing row
  const found = await pool.query(
    `SELECT id
       FROM public.meetings
      WHERE zoom_meeting_id = $1
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1`,
    [zoom_meeting_id]
  );

  if (found.rows.length) {
    return { meeting_id: found.rows[0].id, created: false };
  }

  // 2) Not found → insert new row
  try {
    const inserted = await pool.query(
      `INSERT INTO public.meetings (zoom_meeting_id, host_email, meeting_title, scheduled_start)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [zoom_meeting_id, host_email, meeting_title, scheduled_start]
    );
    return { meeting_id: inserted.rows[0].id, created: true };
  } catch (err) {
    // If a unique constraint exists and another request inserted it first
    if (err && err.code === '23505') {
      const retry = await pool.query(
        `SELECT id
           FROM public.meetings
          WHERE zoom_meeting_id = $1
          ORDER BY created_at DESC NULLS LAST
          LIMIT 1`,
        [zoom_meeting_id]
      );
      if (retry.rows.length) {
        return { meeting_id: retry.rows[0].id, created: false };
      }
    }
    throw err;
  }
}