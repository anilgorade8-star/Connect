import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import usersRouter from "./routes/usersroutes.js";

const isAllowedOrigin = (origin, callback) => {
  // Allow all origins with dynamic reflection for credentials support
  return callback(null, true);
};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: isAllowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const socketToRoom = {};
  const roomMessages = {};

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ==========================================
    // 1. JOIN ROOM (Native Socket.io Room Logic)
    // ==========================================
    socket.on("join-call", (path, username) => {
      let roomId = String(path || "default-room").trim();
      try {
        if (roomId.startsWith("http://") || roomId.startsWith("https://")) {
          const u = new URL(roomId);
          roomId = u.pathname;
        }
      } catch {}
      roomId = roomId.replace(/^\/auth\//, "/").replace(/^\//, "").replace(/\/$/, "") || "default-room";

      console.log("Joining room:", roomId, "User:", username || "Guest", "Socket:", socket.id);

      socket.join(roomId);
      socketToRoom[socket.id] = roomId;

      // Get all existing active sockets in this room (excluding self)
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      const existingUsers = clientsInRoom.filter((id) => id !== socket.id);

      console.log("User joined:", socket.id);
      console.log("Users in room:", clientsInRoom);

      // Send list of existing participants only to newly joined user
      socket.emit("all-users", existingUsers);

      // Notify existing users in the room about the new participant
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        username: username || "Guest",
      });
    });

    // ==========================================
    // 2. TARGETED WEBRTC OFFER
    // ==========================================
    socket.on("offer", ({ target, offer }) => {
      if (!target) return;
      console.log("SENDING OFFER TO:", target, "FROM:", socket.id);
      io.to(target).emit("offer", {
        sender: socket.id,
        offer,
      });
    });

    // ==========================================
    // 3. TARGETED WEBRTC ANSWER
    // ==========================================
    socket.on("answer", ({ target, answer }) => {
      if (!target) return;
      console.log("SENDING ANSWER TO:", target, "FROM:", socket.id);
      io.to(target).emit("answer", {
        sender: socket.id,
        answer,
      });
    });

    // ==========================================
    // 4. TARGETED ICE CANDIDATE
    // ==========================================
    socket.on("ice-candidate", ({ target, candidate }) => {
      if (!target || !candidate) return;
      console.log("SENDING ICE TO:", target, "FROM:", socket.id);
      io.to(target).emit("ice-candidate", {
        sender: socket.id,
        candidate,
      });
    });

    // Backward compatibility for legacy signal handler
    socket.on("signal", (toID, signalMessage) => {
      if (!toID) return;
      io.to(toID).emit("signal", socket.id, signalMessage);
    });

    // ==========================================
    // 5. CHAT MESSAGE
    // ==========================================
    socket.on("chat-message", (data, sender) => {
      const roomId = socketToRoom[socket.id];
      if (!roomId) return;

      if (!roomMessages[roomId]) {
        roomMessages[roomId] = [];
      }

      roomMessages[roomId].push({
        sender,
        data,
        "socket-id-sender": socket.id,
      });

      io.to(roomId).emit("chat-message", data, sender, socket.id);
    });

    // ==========================================
    // 6. DISCONNECT & LEAVE
    // ==========================================
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      const roomId = socketToRoom[socket.id];

      if (roomId) {
        socket.to(roomId).emit("user-left", { socketId: socket.id });
        delete socketToRoom[socket.id];

        const remaining = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        if (remaining.length === 0) {
          delete roomMessages[roomId];
        }
        console.log(`User ${socket.id} left room ${roomId}. Remaining:`, remaining);
      }
    });
  });

  return io;
};

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8080;

app.use(cors({ origin: isAllowedOrigin, credentials: true }));
app.use(express.json());

// Health check and root ping for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/", (req, res) => {
  res.status(200).send("Connect Backend Server Running");
});

app.use("/api/v1/users", usersRouter);

connectToSocket(server);

const startServer = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start server:", error);
  process.exit(1);
});
