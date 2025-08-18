const { MEETING_ID } = require('../config/meetingConfig');

// Server-based timer for Socket.IO 
function attachTimer(io) {
  const timers = {}; 
  const now = () => Date.now();
  const getState = () => timers[MEETING_ID] || { status: 'pending', endAt: 0 };

  const emitStateToAll = () => {
    const s = getState();
    io.to(MEETING_ID).emit('timer:state', { ...s, serverTime: now() });
  };

  const emitStateToSocket = (socket) => {
    const s = getState();
    socket.emit('timer:state', { ...s, serverTime: now() });
  };

  io.on('connection', (socket) => {
    socket.on('joinMeeting', () => {
      socket.join(MEETING_ID);
      emitStateToSocket(socket);
    });

    socket.on('timer:get', () => {
      emitStateToSocket(socket);
    });

    socket.on('timer:start', ({ durationMs }) => {
      const ms = Math.max(0, Number(durationMs || 0));
      if (ms === 0) return;
      const endAt = now() + ms;
      timers[MEETING_ID] = { status: 'running', endAt };
      emitStateToAll();
    });

    socket.on('timer:pause', () => {
      const prev = getState();
      if (prev.status !== 'running') return;
      const remaining = Math.max(0, prev.endAt - now());
      timers[MEETING_ID] = { status: 'paused', endAt: prev.endAt, remainingMs: remaining };
      emitStateToAll();
    });

    socket.on('timer:resume', () => {
      const prev = getState();
      if (prev.status !== 'paused') return;
      const remaining = typeof prev.remainingMs === 'number'
        ? prev.remainingMs
        : Math.max(0, prev.endAt - now());
      const endAt = now() + remaining;
      timers[MEETING_ID] = { status: 'running', endAt };
      emitStateToAll();
    });

    socket.on('timer:cancel', () => {
      timers[MEETING_ID] = { status: 'pending', endAt: 0 };
      emitStateToAll();
    });

    socket.on('timer:edit:save', ({ proposedEndAt }) => {
      const endAt = Math.max(now(), Math.floor(Number(proposedEndAt) || 0));
      const prev = getState();
      const status = prev.status === 'pending' ? 'running' : prev.status;

      if (status === 'paused') {
        const remaining = Math.max(0, endAt - now());
        timers[MEETING_ID] = { status: 'paused', endAt, remainingMs: remaining };
      } else {
        timers[MEETING_ID] = { status, endAt };
      }
      emitStateToAll();
    });
  });
}

module.exports = { attachTimer };
