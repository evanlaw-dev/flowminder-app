export const MEETING_ID =
  process.env.NEXT_PUBLIC_MEETING_ID || "64ca6b89-8df7-458f-a2f1-bcd4e41b1614";

export const CURRENT_USER_ID =
  // Use a distinct env var for the current user; fall back to a stable anon label
  process.env.NEXT_PUBLIC_USER_ID || "anonymous-user";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  