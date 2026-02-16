'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export function useRealtimeCollaboration(pageId, userId, userName) {
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!pageId || !userId) return;

    // Create socket connection
    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Authenticate
      socketInstance.emit('authenticate', { userId, userName });

      // Join page room
      socketInstance.emit('join-page', pageId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Handle users already in page
    socketInstance.on('users-in-page', (users) => {
      setActiveUsers(users.filter(u => u.userId !== userId));
    });

    // Handle user joined
    socketInstance.on('user-joined', (user) => {
      if (user.userId !== userId) {
        setActiveUsers(prev => [...prev, user]);
      }
    });

    // Handle user left
    socketInstance.on('user-left', (user) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== user.userId));
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[user.userId];
        return newCursors;
      });
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        delete newTyping[user.userId];
        return newTyping;
      });
    });

    // Handle block updates from other users
    socketInstance.on('block-updated', ({ blockId, content, userId: editorId }) => {
      if (editorId !== userId) {
        // Trigger callback for block update
        window.dispatchEvent(new CustomEvent('remote-block-update', {
          detail: { blockId, content, userId: editorId }
        }));
      }
    });

    // Handle cursor movements
    socketInstance.on('cursor-moved', ({ userId: cursorUserId, userName, position, blockId }) => {
      if (cursorUserId !== userId) {
        setCursors(prev => ({
          ...prev,
          [cursorUserId]: { userName, position, blockId, timestamp: Date.now() }
        }));
      }
    });

    // Handle typing indicators
    socketInstance.on('user-typing', ({ userId: typingUserId, userName, blockId }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => ({
          ...prev,
          [typingUserId]: { userName, blockId, timestamp: Date.now() }
        }));
      }
    });

    socketInstance.on('user-stopped-typing', ({ userId: typingUserId }) => {
      setTypingUsers(prev => {
        const newTyping = { ...prev };
        delete newTyping[typingUserId];
        return newTyping;
      });
    });

    // Handle title updates
    socketInstance.on('title-updated', ({ title, userId: editorId }) => {
      if (editorId !== userId) {
        window.dispatchEvent(new CustomEvent('remote-title-update', {
          detail: { title, userId: editorId }
        }));
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.emit('leave-page', pageId);
        socketInstance.disconnect();
      }
    };
  }, [pageId, userId, userName]);

  // Emit block update
  const emitBlockUpdate = useCallback((blockId, content, properties) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('block-update', {
        pageId,
        blockId,
        content,
        properties
      });
    }
  }, [pageId, isConnected]);

  // Emit cursor movement
  const emitCursorMove = useCallback((position, blockId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-move', {
        pageId,
        position,
        blockId
      });
    }
  }, [pageId, isConnected]);

  // Emit typing start
  const emitTypingStart = useCallback((blockId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-start', {
        pageId,
        blockId
      });
    }
  }, [pageId, isConnected]);

  // Emit typing stop
  const emitTypingStop = useCallback((blockId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-stop', {
        pageId,
        blockId
      });
    }
  }, [pageId, isConnected]);

  // Emit title update
  const emitTitleUpdate = useCallback((title) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('title-update', {
        pageId,
        title
      });
    }
  }, [pageId, isConnected]);

  return {
    socket,
    isConnected,
    activeUsers,
    cursors,
    typingUsers,
    emitBlockUpdate,
    emitCursorMove,
    emitTypingStart,
    emitTypingStop,
    emitTitleUpdate
  };
}
