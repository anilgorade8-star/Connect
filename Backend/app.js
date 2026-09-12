import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import usersRouter from "./routes/usersroutes.js";

let connections = {};
let message = {};
let timeOnline = {};

const isAllowedOrigin = (origin, callback) => {
  if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return callback(null, true);
  }
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

  io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED:", socket.id);

    // ==========================================
    // JOIN CALL
    // ==========================================

    socket.on("join-call", (path) => {
      let roomId = String(path || "default-room").trim();
      try {
        if (roomId.startsWith("http://") || roomId.startsWith("https://")) {
          const u = new URL(roomId);
          roomId = u.pathname;
        }
      } catch {}
      roomId = roomId.replace(/^\/auth\//, "/").replace(/^\//, "").replace(/\/$/, "") || "default-room";

      console.log(
        "JOIN CALL:",
        socket.id,
        "Room:",
        roomId
      );

      if (!connections[roomId]) {
        connections[roomId] = [];
      }

      if (!connections[roomId].includes(socket.id)) {
        connections[roomId].push(socket.id);
      }

      timeOnline[socket.id] = new Date();

      const clients = connections[roomId];

      console.log(
        "CLIENTS IN ROOM:",
        roomId,
        clients
      );

      // Tell every user about the users
      // currently inside the room (emit both user-join and user-joined)
      clients.forEach((clientId) => {
        io.to(clientId).emit(
          "user-join",
          socket.id,
          clients
        );
        io.to(clientId).emit(
          "user-joined",
          socket.id,
          clients
        );
      });
    });

    // ==========================================
    // WEBRTC SIGNAL
    // ==========================================

    socket.on(
      "signal",
      (toID, signalMessage) => {
        console.log(
          "SIGNAL:",
          socket.id,
          "->",
          toID
        );

        if (!toID) {
          console.log(
            "SIGNAL ERROR: No target ID"
          );
          return;
        }

        io.to(toID).emit(
          "signal",
          socket.id,
          signalMessage
        );
      }
    );

    // ==========================================
    // CHAT MESSAGE
    // ==========================================

    socket.on(
      "chat-message",
      (data, sender) => {
        let matchingRoom = null;

        for (const [
          roomId,
          clients,
        ] of Object.entries(connections)) {
          if (clients.includes(socket.id)) {
            matchingRoom = roomId;
            break;
          }
        }

        if (!matchingRoom) {
          return;
        }

        if (!message[matchingRoom]) {
          message[matchingRoom] = [];
        }

        message[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        connections[matchingRoom].forEach(
          (clientId) => {
            io.to(clientId).emit(
              "chat-message",
              data,
              sender,
              socket.id
            );
          }
        );
      }
    );

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on("disconnect", () => {
      console.log(
        "SOCKET DISCONNECTED:",
        socket.id
      );

      delete timeOnline[socket.id];

      for (const [
        roomId,
        clients,
      ] of Object.entries(connections)) {
        if (!clients.includes(socket.id)) {
          continue;
        }

        // Tell other users
        clients.forEach((clientId) => {
          if (clientId !== socket.id) {
            io.to(clientId).emit(
              "user-left",
              socket.id
            );
          }
        });

        // Remove user
        connections[roomId] =
          clients.filter(
            (id) => id !== socket.id
          );

        // Remove empty room
        if (
          connections[roomId].length === 0
        ) {
          delete connections[roomId];

          if (message[roomId]) {
            delete message[roomId];
          }
        }
      }
    });
  });

  return io;
};

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: isAllowedOrigin,
    credentials: true,
  })
);
app.use(express.json());
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
