const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // All authenticated users join the shared global room for broadcast updates
    socket.join('global');

    // Also join their personal room for targeted notifications
    socket.on('join', async (data) => {
      let userId, role;
      if (data && typeof data === 'object') {
        userId = data.userId;
        role = data.role;
      } else {
        userId = data;
      }

      if (!userId) return;

      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room: user_${userId}`);

      if (!role) {
        try {
          const User = require('../models/User');
          const user = await User.findById(userId);
          if (user) role = user.role;
        } catch (err) {
          console.error('Error finding user for socket join:', err);
        }
      }

      if (role === 'super_admin') {
        socket.join('super_admin');
        console.log(`Super Admin ${userId} joined room: super_admin`);
      }
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
