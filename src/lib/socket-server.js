import { Server } from 'socket.io';

let io = null;

export function initSocketServer(httpServer) {
  if (io) {
    console.log('Socket.io server already initialized');
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/api/socket'
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Store user info on socket
    socket.userId = null;
    socket.userName = null;
    socket.currentPageId = null;

    // Authenticate user
    socket.on('authenticate', ({ userId, userName }) => {
      socket.userId = userId;
      socket.userName = userName;
      console.log(`User authenticated: ${userName} (${userId})`);
    });

    // Join page room for real-time collaboration
    socket.on('join-page', (pageId) => {
      if (socket.currentPageId) {
        socket.leave(`page:${socket.currentPageId}`);
      }

      socket.currentPageId = pageId;
      socket.join(`page:${pageId}`);

      // Notify others in the room
      socket.to(`page:${pageId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });

      console.log(`${socket.userName} joined page: ${pageId}`);

      // Send current users list to the new joiner
      const sockets = io.sockets.adapter.rooms.get(`page:${pageId}`);
      const users = [];
      if (sockets) {
        sockets.forEach(socketId => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.userId) {
            users.push({
              userId: s.userId,
              userName: s.userName,
              socketId: s.id
            });
          }
        });
      }
      socket.emit('users-in-page', users);
    });

    // Leave page room
    socket.on('leave-page', (pageId) => {
      socket.leave(`page:${pageId}`);
      socket.to(`page:${pageId}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName
      });
      console.log(`${socket.userName} left page: ${pageId}`);
      socket.currentPageId = null;
    });

    // Broadcast block updates
    socket.on('block-update', ({ pageId, blockId, content, properties }) => {
      socket.to(`page:${pageId}`).emit('block-updated', {
        blockId,
        content,
        properties,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Broadcast cursor position
    socket.on('cursor-move', ({ pageId, position, blockId }) => {
      socket.to(`page:${pageId}`).emit('cursor-moved', {
        userId: socket.userId,
        userName: socket.userName,
        position,
        blockId,
        timestamp: Date.now()
      });
    });

    // Typing indicators
    socket.on('typing-start', ({ pageId, blockId }) => {
      socket.to(`page:${pageId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        blockId,
        timestamp: Date.now()
      });
    });

    socket.on('typing-stop', ({ pageId, blockId }) => {
      socket.to(`page:${pageId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        blockId
      });
    });

    // Presence updates
    socket.on('presence-update', ({ pageId, status, cursorPosition }) => {
      socket.to(`page:${pageId}`).emit('presence-changed', {
        userId: socket.userId,
        userName: socket.userName,
        status,
        cursorPosition,
        timestamp: Date.now()
      });
    });

    // Page title updates
    socket.on('title-update', ({ pageId, title }) => {
      socket.to(`page:${pageId}`).emit('title-updated', {
        title,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.currentPageId) {
        socket.to(`page:${socket.currentPageId}`).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName
        });
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocketServer() first.');
  }
  return io;
}
