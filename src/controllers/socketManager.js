import { Server } from 'socket.io';

const MAX_CHAT_HISTORY = 200;

const roomParticipants = new Map();
const roomMessages = new Map();
const joinTimestamps = new Map();

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['*'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-call', (roomId) => {
      try {
        if (!roomId || typeof roomId !== 'string') return;

        socket.join(roomId);

        if (!roomParticipants.has(roomId))
          roomParticipants.set(roomId, new Set());
        const participants = roomParticipants.get(roomId);
        participants.add(socket.id);

        joinTimestamps.set(socket.id, Date.now());

        socket
          .to(roomId)
          .emit('user-joined', socket.id, Array.from(participants));

        const history = roomMessages.get(roomId);
        if (Array.isArray(history) && history.length > 0) {
          for (const msg of history) {
            socket.emit(
              'chat-message',
              msg.data,
              msg.sender,
              msg.socketId,
              msg.ts
            );
          }
        }
      } catch (err) {
        console.error('join-call error:', err);
      }
    });

    socket.on('signal', (targetSocketId, payload) => {
      try {
        if (!targetSocketId || !payload) return;
        io.to(targetSocketId).emit('signal', socket.id, payload);
      } catch (err) {
        console.error('signal error:', err);
      }
    });

    socket.on('chat-message', (roomId, messageText, senderName) => {
      try {
        if (!roomId || !messageText) return;
        if (!roomParticipants.has(roomId)) return;

        const msgObj = {
          data: messageText,
          sender: senderName || 'Unknown',
          socketId: socket.id,
          ts: Date.now(),
        };

        if (!roomMessages.has(roomId)) roomMessages.set(roomId, []);
        const history = roomMessages.get(roomId);
        history.push(msgObj);
        if (history.length > MAX_CHAT_HISTORY) history.shift();

        io.in(roomId).emit(
          'chat-message',
          msgObj.data,
          msgObj.sender,
          msgObj.socketId,
          msgObj.ts
        );
      } catch (err) {
        console.error('chat-message error:', err);
      }
    });

    socket.on('disconnect', () => {
      try {
        const roomsToCleanup = [];

        for (const [roomId, participants] of roomParticipants.entries()) {
          if (participants.has(socket.id)) {
            participants.delete(socket.id);
            socket
              .to(roomId)
              .emit('user-left', socket.id, Array.from(participants));

            if (participants.size === 0) {
              roomsToCleanup.push(roomId);
            }
          }
        }

        for (const roomId of roomsToCleanup) {
          roomParticipants.delete(roomId);
        }

        joinTimestamps.delete(socket.id);
      } catch (err) {
        console.error('disconnect error:', err);
      }
    });
  });

  return io;
};
