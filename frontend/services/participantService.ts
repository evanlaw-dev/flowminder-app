export interface Participant {
  id: number;
  name: string;
  email?: string;
  role: string;
}

export interface NudgeRequest {
  meeting_id: string;
  participant_id: number;
  nudge_type: string;
  message?: string;
}

export interface NudgeStats {
  move_along_count: number;
  invite_speak_count: number;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function buildUrl(pathname: string, params?: Record<string, string | number | boolean | undefined>): string {
  // Ensure a valid absolute base URL. Fall back to http://localhost:4000 if invalid.
  let base = backendUrl;
  try {
    // Throws if base is invalid
    // eslint-disable-next-line no-new
    new URL('about:blank', base);
  } catch {
    // If missing protocol, try http:// prefix
    if (typeof base === 'string' && !/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
    try {
      // eslint-disable-next-line no-new
      new URL('about:blank', base);
    } catch {
      base = 'http://localhost:4000';
    }
  }

  const url = new URL(pathname, base);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function parseJsonOrThrow(response: Response) {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed ${response.status}${text ? `: ${text}` : ''}`);
  }
  return response.json();
}

export async function getParticipants(meetingId: string): Promise<Participant[]> {
  try {
    const response = await fetch(buildUrl('/participants', { meeting_id: meetingId }));
    const data = await parseJsonOrThrow(response);
    
    if (data.success) {
      return data.participants;
    } else {
      throw new Error(data.error || 'Failed to fetch participants');
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
}

export async function addParticipant(meetingId: string, name: string, email?: string, role: string = 'participant'): Promise<Participant | null> {
  try {
    const response = await fetch(buildUrl('/participants'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meeting_id: meetingId,
        name,
        email,
        role
      })
    });
    
    const data = await parseJsonOrThrow(response);
    
    if (data.success) {
      return data.participant;
    } else {
      throw new Error(data.error || 'Failed to add participant');
    }
  } catch (error) {
    console.error('Error adding participant:', error);
    return null;
  }
}

export async function sendNudge(nudgeRequest: NudgeRequest): Promise<boolean> {
  try {
    const response = await fetch(buildUrl('/nudge'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nudgeRequest)
    });
    
    const data = await parseJsonOrThrow(response);
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Failed to send nudge');
    }
  } catch (error) {
    console.error('Error sending nudge:', error);
    return false;
  }
}

export async function getNudgeStats(meetingId: string): Promise<NudgeStats> {
  try {
    const response = await fetch(buildUrl('/nudge-stats', { meeting_id: meetingId }));
    const data = await parseJsonOrThrow(response);
    
    if (data.success) {
      return data.stats;
    } else {
      throw new Error(data.error || 'Failed to fetch nudge stats');
    }
  } catch (error) {
    console.error('Error fetching nudge stats:', error);
    return { move_along_count: 0, invite_speak_count: 0 };
  }
} 