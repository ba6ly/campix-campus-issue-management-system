const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // All authenticated users join the shared global room for broadcast updates
    socket.join('global');

    // Also join their personal room for targeted notifications
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined rooms: user_${userId}, global`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

const broadcastDashboardUpdate = (io, payload = {}) => {
  if (!io) return;
  io.to('global').emit('dashboard:update', { ts: Date.now(), ...payload });
};

module.exports = { setupSockets, broadcastDashboardUpdate };
