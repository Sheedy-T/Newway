// utils/signaling.js
const LiveRoom = require("../models/LiveRoom"); // Import the Mongoose model

module.exports = (io, rooms) => {
  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    // This function will now assume the rooms object is already passed in
    // and correctly initialized.
    const broadcastRoster = (roomId) => {
      const room = rooms[roomId];
      if (!room) return;
      const users = Object.values(room.users).map(u => ({
        peerId: u.peerId,
        displayName: u.displayName,
        role: u.role,
        approved: !!u.approved,
        camOn: !!u.camOn,
        micOn: !!u.micOn,
      }));
      io.to(roomId).emit('roster', { users, screenSharer: room.screenSharer });
    };

    // -------- Join room --------
    socket.on('join-room', async ({ roomId, displayName, role }) => {
      try {
        if (!roomId) return;

        // Find or create the room in MongoDB
        let dbRoom = await LiveRoom.findOne({ roomId });
        if (!dbRoom) {
          dbRoom = new LiveRoom({
            roomId,
            title: roomId, // Use roomId as a fallback title
          });
          await dbRoom.save();
          console.log(`✨ New room '${roomId}' created in MongoDB.`);
        }

        // Add the new participant to the database record
        dbRoom.participants.push({
          socketId: socket.id,
          displayName: displayName || "Guest",
          role: role || "student",
        });
        await dbRoom.save();

        // Initialize in-memory room state if not exists
        if (!rooms[roomId]) {
          rooms[roomId] = { users: {}, screenSharer: null, messages: [] };
        }
        const room = rooms[roomId];

        socket.join(roomId);
        socket.roomId = roomId;
        socket.displayName = (displayName || 'Guest').trim();
        socket.role = (role || 'student').trim();

        // Add user to in-memory room
        room.users[socket.id] = {
          peerId: socket.id,
          displayName: socket.displayName,
          role: socket.role,
          approved: socket.role === 'admin',
          camOn: false,
          micOn: false,
        };

        broadcastRoster(roomId);
        io.to(socket.id).emit('room-history', room.messages || []);

        if (socket.role === 'admin') {
          const pending = Object.values(room.users).filter(u => u.role === 'student' && !u.approved);
          io.to(socket.id).emit('pending-users', pending);

          const approvedUsers = Object.values(room.users).filter(u => u.approved && u.peerId !== socket.id);
          approvedUsers.forEach(u => {
            io.to(socket.id).emit('start-webrtc', {
              otherId: u.peerId, initiator: true, otherName: u.displayName,
            });
            io.to(u.peerId).emit('start-webrtc', {
              otherId: socket.id, initiator: false, otherName: room.users[socket.id].displayName,
            });
          });
        } else {
          const admins = Object.values(room.users).filter(u => u.role === 'admin');
          admins.forEach(a => {
            io.to(a.peerId).emit('join-request', { peerId: socket.id, displayName: socket.displayName });
          });
        }
        console.log(`User ${socket.displayName} joined room ${roomId}`);
      } catch (err) {
        console.error('join-room error:', err);
      }
    });

    // -------- Approve / Reject --------
    socket.on('approve-user', async ({ roomId, peerId }) => {
      try {
        const room = rooms[roomId];
        if (!room || !room.users[peerId]) return;
        const approver = room.users[socket.id];
        if (!approver || approver.role !== 'admin') return;

        room.users[peerId].approved = true;

        // Update the database record
        await LiveRoom.findOneAndUpdate(
          { roomId, 'participants.socketId': peerId },
          { '$set': { 'participants.$.role': 'approved' } }
        );

        io.to(peerId).emit('approved', { approved: true, displayName: room.users[peerId].displayName });

        const targets = Object.values(room.users).filter(u => u.approved && u.peerId !== peerId);
        targets.forEach(u => {
          io.to(u.peerId).emit('start-webrtc', {
            otherId: peerId, initiator: true, otherName: room.users[peerId].displayName,
          });
          io.to(peerId).emit('start-webrtc', {
            otherId: u.peerId, initiator: false, otherName: u.displayName,
          });
        });

        broadcastRoster(roomId);
        console.log(`🔗 Approved ${peerId} with ${targets.length} peers`);
      } catch (err) {
        console.error('approve-user error:', err);
      }
    });

    socket.on('reject-user', async ({ roomId, peerId }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        const approver = room.users[socket.id];
        if (!approver || approver.role !== 'admin') return;

        io.to(peerId).emit('approved', { approved: false });
        delete room.users[peerId];

        // Update the database record
        await LiveRoom.findOneAndUpdate(
          { roomId },
          { '$pull': { 'participants': { socketId: peerId } } }
        );

        broadcastRoster(roomId);
      } catch (err) {
        console.error('reject-user error:', err);
      }
    });

    // -------- Signaling (mesh) --------
    socket.on('signal', ({ to, from, signal }) => {
      try {
        if (!to || !signal) return;
        io.to(to).emit('signal', { from: from || socket.id, signal });
      } catch (err) {
        console.error('signal relay error:', err);
      }
    });

    // -------- Media state (for UI covers) --------
    socket.on('media-state', ({ roomId, camOn, micOn }) => {
      try {
        const room = rooms[roomId];
        if (!room || !room.users[socket.id]) return;
        room.users[socket.id].camOn = !!camOn;
        room.users[socket.id].micOn = !!micOn;
        broadcastRoster(roomId);
      } catch (err) {
        console.error('media-state error:', err);
      }
    });

    // -------- Screen share (one at a time) --------
    socket.on('request-screen', ({ roomId }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        if (room.screenSharer && room.screenSharer !== socket.id) {
          io.to(socket.id).emit('screen-denied', { reason: 'Another user is sharing' });
          return;
        }
        room.screenSharer = socket.id;
        io.to(roomId).emit('screen-started', { peerId: socket.id });
      } catch (err) {
        console.error('request-screen error:', err);
      }
    });

    socket.on('stop-screen', ({ roomId }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        if (room.screenSharer === socket.id) {
          room.screenSharer = null;
          io.to(roomId).emit('screen-stopped', { peerId: socket.id });
        }
      } catch (err) {
        console.error('stop-screen error:', err);
      }
    });

    // -------- Chat (persistent per-room in-memory, capped) --------
    socket.on('chat-message', ({ roomId, message, displayName }) => {
      try {
        if (!roomId || !message) return;
        const room = rooms[roomId];
        const payload = {
          message: (message || "").toString(),
          displayName: (displayName || 'Guest').trim(),
          ts: Date.now(),
        };
        room.messages = room.messages || [];
        room.messages.push(payload);
        if (room.messages.length > 200) room.messages.shift();
        io.to(roomId).emit('chat-message', payload);
      } catch (err) {
        console.error('chat-message error:', err);
      }
    });

    // -------- Admin Controls on participants --------
    // action: 'kick' | 'mute' | 'unmute' | 'camOff' | 'camOn'
    socket.on('admin-control', ({ roomId, targetId, action }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        const admin = room.users[socket.id];
        if (!admin || admin.role !== 'admin') return;
        if (!room.users[targetId]) return;

        switch (action) {
          case 'kick':
            io.to(targetId).emit('forced-disconnect');
            delete room.users[targetId];
            io.to(roomId).emit('peer-left', { peerId: targetId });
            break;
          case 'mute':
            room.users[targetId].micOn = false;
            io.to(targetId).emit('force-mute');
            io.to(roomId).emit('media-state', { peerId: targetId, camOn: room.users[targetId].camOn, micOn: false });
            break;
          case 'unmute':
            room.users[targetId].micOn = true;
            io.to(targetId).emit('force-unmute');
            io.to(roomId).emit('media-state', { peerId: targetId, camOn: room.users[targetId].camOn, micOn: true });
            break;
          case 'camOff':
            room.users[targetId].camOn = false;
            io.to(targetId).emit('force-cam-off');
            io.to(roomId).emit('media-state', { peerId: targetId, camOn: false, micOn: room.users[targetId].micOn });
            break;
          case 'camOn':
            room.users[targetId].camOn = true;
            io.to(targetId).emit('force-cam-on');
            io.to(roomId).emit('media-state', { peerId: targetId, camOn: true, micOn: room.users[targetId].micOn });
            break;
        }
        broadcastRoster(roomId);
      } catch (err) {
        console.error('admin-control error:', err);
      }
    });

    // -------- Participant leaves themselves --------
    socket.on('leave-room', async ({ roomId }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        if (room.screenSharer === socket.id) {
          room.screenSharer = null;
          socket.to(roomId).emit('screen-stopped', { peerId: socket.id });
        }
        delete room.users[socket.id];
        socket.leave(roomId);
        socket.to(roomId).emit('peer-left', { peerId: socket.id });

        // Update the database record
        await LiveRoom.findOneAndUpdate(
          { roomId },
          { '$pull': { 'participants': { socketId: socket.id } } }
        );

        broadcastRoster(roomId);
      } catch (err) {
        console.error('leave-room error:', err);
      }
    });

    // -------- Admin ends live for everyone --------
    socket.on('end-live', async ({ roomId }) => {
      try {
        const room = rooms[roomId];
        if (!room) return;
        const admin = room.users[socket.id];
        if (!admin || admin.role !== 'admin') return;

        io.to(roomId).emit('live-ended');

        // Clear in-memory room state
        rooms[roomId] = { users: {}, screenSharer: null, messages: room.messages || [] };

        // Remove all participants from the database record
        await LiveRoom.findOneAndUpdate(
          { roomId },
          { '$set': { 'participants': [] } }
        );

        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets) {
          for (const sid of roomSockets) {
            const s = io.sockets.sockets.get(sid);
            if (s) s.leave(roomId);
          }
        }
      } catch (err) {
        console.error('end-live error:', err);
      }
    });

    // -------- Disconnect --------
    socket.on('disconnect', async () => {
      try {
        const { roomId } = socket;
        if (roomId && rooms[roomId]) {
          const room = rooms[roomId];
          if (room.screenSharer === socket.id) {
            room.screenSharer = null;
            socket.to(roomId).emit('screen-stopped', { peerId: socket.id });
          }
          delete room.users[socket.id];
          socket.to(roomId).emit('peer-left', { peerId: socket.id });

          // Update the database record
          await LiveRoom.findOneAndUpdate(
            { roomId },
            { '$pull': { 'participants': { socketId: socket.id } } }
          );

          broadcastRoster(roomId);
        }
        console.log('❌ Disconnected:', socket.id);
      } catch (err) {
        console.error('disconnect error:', err);
      }
    });
  });
};