const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// I should have used typescript
// sid -> { userId, userName, location, bait, time, weather, catches: [.. fish ..], createdAt }
// ---------------------------------------------------------------------------
const sessions = new Map();

// Cleans out session data from memory
setInterval(
  () => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [sid, s] of sessions)
      if (s.createdAt < cutoff) sessions.delete(sid);
  },
  5 * 60 * 1000,
).unref();

export const getTotalCaught = (session) => session.catches.length;

export function createNewSession(sessionId, userId, userName) {
  const session = {
    userId: userId,
    userName: userName,
    location: null,
    bait: null,
    time: null,
    weather: null,
    catches: [],
    createdAt: Date.now(),
    sessionId,
  };

  sessions.set(sessionId, session);

  console.log("Creating session: ", {
    ...session,
  });

  return session;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}
