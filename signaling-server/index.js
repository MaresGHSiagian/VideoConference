const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store rooms and participants
const rooms = new Map();
const participants = new Map();
const connectionHealth = new Map();

// Utility functions
const getRoomInfo = (roomId) => {
  return (
    rooms.get(roomId) || {
      participants: [],
      messages: [],
      createdAt: new Date(),
      settings: {
        maxParticipants: 50,
        allowRecording: true,
        allowScreenShare: true,
        allowChat: true,
      },
    }
  );
};

const addParticipantToRoom = (roomId, participant) => {
  const room = getRoomInfo(roomId);

  // Check if room is full
  if (room.participants.length >= room.settings.maxParticipants) {
    return false;
  }

  // Remove existing participant with same socketId (reconnection)
  room.participants = room.participants.filter(
    (p) => p.socketId !== participant.socketId
  );

  room.participants.push(participant);
  rooms.set(roomId, room);
  return true;
};

const removeParticipantFromRoom = (roomId, socketId) => {
  const room = getRoomInfo(roomId);
  room.participants = room.participants.filter((p) => p.socketId !== socketId);

  // Remove empty rooms after some time
  if (room.participants.length === 0) {
    setTimeout(() => {
      const currentRoom = getRoomInfo(roomId);
      if (currentRoom.participants.length === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted due to inactivity`);
      }
    }, 60000); // 1 minute
  }

  rooms.set(roomId, room);
};

const addMessageToRoom = (roomId, message) => {
  const room = getRoomInfo(roomId);

  // Limit message history to last 100 messages
  room.messages.push(message);
  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100);
  }

  rooms.set(roomId, room);
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("join-room", (data) => {
    const { roomId, user } = data;

    socket.join(roomId);

    const participant = {
      socketId: socket.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      isVideoOn: true,
      isAudioOn: true,
      isScreenSharing: false,
      joinedAt: new Date().toISOString(),
      connectionQuality: "good",
    };

    participants.set(socket.id, { roomId, participant });

    // Try to add participant to room
    const added = addParticipantToRoom(roomId, participant);

    if (!added) {
      socket.emit("room-full", { roomId, maxParticipants: 50 });
      return;
    }

    const room = getRoomInfo(roomId);

    // Set up connection health monitoring
    connectionHealth.set(socket.id, {
      lastPing: Date.now(),
      quality: "good",
      reconnectCount: 0,
    });

    // Send initial room state to new participant
    socket.emit("room-state", {
      participants: room.participants,
      messages: room.messages,
      roomInfo: {
        id: roomId,
        participantCount: room.participants.length,
        maxParticipants: room.settings.maxParticipants,
        settings: room.settings,
      },
    });

    // Notify others about new participant
    socket.to(roomId).emit("participant-joined", participant);

    // Send existing participants to new user for WebRTC setup
    const otherParticipants = room.participants.filter(
      (p) => p.socketId !== socket.id
    );
    socket.emit("existing-participants", otherParticipants);

    console.log(
      `User ${user.name} joined room ${roomId} (${room.participants.length}/${room.settings.maxParticipants})`
    );
  });

  // WebRTC signaling
  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  // Media controls
  socket.on("toggle-video", (data) => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("participant-video-toggle", {
        socketId: socket.id,
        isVideoOn: data.isVideoOn,
      });
    }
  });

  socket.on("toggle-audio", (data) => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("participant-audio-toggle", {
        socketId: socket.id,
        isAudioOn: data.isAudioOn,
      });
    }
  });

  socket.on("start-screen-share", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("participant-screen-share-start", {
        socketId: socket.id,
      });
    }
  });

  socket.on("stop-screen-share", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("participant-screen-share-stop", {
        socketId: socket.id,
      });
    }
  });

  // Chat functionality
  socket.on("send-message", (data) => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId, participant } = participantData;
      const message = {
        id: Date.now().toString(),
        text: data.text,
        sender: {
          id: participant.userId,
          name: participant.name,
        },
        timestamp: new Date().toISOString(),
      };

      addMessageToRoom(roomId, message);
      io.to(roomId).emit("new-message", message);
    }
  });

  // Recording controls
  socket.on("start-recording", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("recording-started", {
        socketId: socket.id,
      });
    }
  });

  socket.on("stop-recording", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.to(roomId).emit("recording-stopped", {
        socketId: socket.id,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      removeParticipantFromRoom(roomId, socket.id);

      socket.to(roomId).emit("participant-left", {
        socketId: socket.id,
      });

      console.log(`User ${socket.id} left room ${roomId}`);
    }

    participants.delete(socket.id);
    console.log("User disconnected:", socket.id);
  });

  // Leave room
  socket.on("leave-room", () => {
    const participantData = participants.get(socket.id);
    if (participantData) {
      const { roomId } = participantData;
      socket.leave(roomId);
      removeParticipantFromRoom(roomId, socket.id);

      socket.to(roomId).emit("participant-left", {
        socketId: socket.id,
      });
    }

    participants.delete(socket.id);
  });
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Get room info endpoint
app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const room = getRoomInfo(roomId);
  res.json({
    roomId,
    participantCount: room.participants.length,
    participants: room.participants.map((p) => ({
      name: p.name,
      email: p.email,
      joinedAt: p.joinedAt,
    })),
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
