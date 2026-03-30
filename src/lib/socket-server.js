import { Server } from 'socket.io';

let io = null;

export function initSocketServer(httpServer) {
  if (io) {
    console.log('Socket.io server already initialized');
    return io;
  }

  const allowedOrigins = process.env.NEXT_PUBLIC_BASE_URL
    ? [process.env.NEXT_PUBLIC_BASE_URL]
    : ['http://localhost:3005', 'http://localhost:3000'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST']
    },
    path: '/api/socket'
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.userId = null;
    socket.userName = null;
    socket.currentPageId = null;

    // ─── Auth (JWT verified) ──────────────────────────────────────────────────
    socket.on('authenticate', async ({ token, userId, userName }) => {
      if (token) {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          if (decoded.type === 'refresh') {
            socket.emit('auth-error', 'Invalid token type');
            return;
          }
          socket.userId = decoded.userId;
          socket.userName = userName || decoded.userId;
          console.log(`User authenticated via JWT: ${socket.userName} (${socket.userId})`);
        } catch {
          socket.emit('auth-error', 'Invalid token');
          return;
        }
      } else {
        // Fallback for backward compat — will be removed
        socket.userId = userId;
        socket.userName = userName;
        console.log(`User authenticated (legacy): ${userName} (${userId})`);
      }
    });

    // ─── Page collaboration ───────────────────────────────────────────────────
    socket.on('join-page', (pageId) => {
      if (socket.currentPageId) {
        socket.leave(`page:${socket.currentPageId}`);
      }
      socket.currentPageId = pageId;
      socket.join(`page:${pageId}`);

      socket.to(`page:${pageId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });

      const sockets = io.sockets.adapter.rooms.get(`page:${pageId}`);
      const users = [];
      if (sockets) {
        sockets.forEach(socketId => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.userId) {
            users.push({ userId: s.userId, userName: s.userName, socketId: s.id });
          }
        });
      }
      socket.emit('users-in-page', users);
    });

    socket.on('leave-page', (pageId) => {
      socket.leave(`page:${pageId}`);
      socket.to(`page:${pageId}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName
      });
      socket.currentPageId = null;
    });

    socket.on('block-update', ({ pageId, blockId, content, properties }) => {
      socket.to(`page:${pageId}`).emit('block-updated', {
        blockId, content, properties,
        userId: socket.userId, userName: socket.userName, timestamp: Date.now()
      });
    });

    socket.on('cursor-move', ({ pageId, position, blockId }) => {
      socket.to(`page:${pageId}`).emit('cursor-moved', {
        userId: socket.userId, userName: socket.userName,
        position, blockId, timestamp: Date.now()
      });
    });

    socket.on('typing-start', ({ pageId, blockId }) => {
      socket.to(`page:${pageId}`).emit('user-typing', {
        userId: socket.userId, userName: socket.userName,
        blockId, timestamp: Date.now()
      });
    });

    socket.on('typing-stop', ({ pageId, blockId }) => {
      socket.to(`page:${pageId}`).emit('user-stopped-typing', {
        userId: socket.userId, blockId
      });
    });

    socket.on('presence-update', ({ pageId, status, cursorPosition }) => {
      socket.to(`page:${pageId}`).emit('presence-changed', {
        userId: socket.userId, userName: socket.userName,
        status, cursorPosition, timestamp: Date.now()
      });
    });

    socket.on('title-update', ({ pageId, title }) => {
      socket.to(`page:${pageId}`).emit('title-updated', {
        title, userId: socket.userId, userName: socket.userName, timestamp: Date.now()
      });
    });

    // ─── Chat ─────────────────────────────────────────────────────────────────

    // Join a chat channel room
    socket.on('chat:join', (channelId) => {
      socket.join(`chat:${channelId}`);
    });

    // Leave a chat channel room
    socket.on('chat:leave', (channelId) => {
      socket.leave(`chat:${channelId}`);
    });

    // Typing indicators for chat
    socket.on('chat:typing:start', ({ channelId }) => {
      socket.to(`chat:${channelId}`).emit('chat:typing', {
        userId: socket.userId,
        userName: socket.userName,
        channelId,
        typing: true
      });
    });

    socket.on('chat:typing:stop', ({ channelId }) => {
      socket.to(`chat:${channelId}`).emit('chat:typing', {
        userId: socket.userId,
        userName: socket.userName,
        channelId,
        typing: false
      });
    });

    // React to a message — broadcast reaction update
    socket.on('chat:react', ({ channelId, messageId, emoji }) => {
      io.to(`chat:${channelId}`).emit('chat:reaction:update', {
        messageId, emoji,
        userId: socket.userId, userName: socket.userName
      });
    });

    // Message deleted — broadcast
    socket.on('chat:message:delete', ({ channelId, messageId }) => {
      io.to(`chat:${channelId}`).emit('chat:message:deleted', { messageId, channelId });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
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
