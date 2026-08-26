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

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ],
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
      console.log(
        "JOIN CALL:",
        socket.id,
        path
      );

      if (!connections[path]) {
        connections[path] = [];
      }

      if (!connections[path].includes(socket.id)) {
        connections[path].push(socket.id);
      }

      timeOnline[socket.id] = new Date();

      const clients = connections[path];

      console.log(
        "CLIENTS IN ROOM:",
        clients
      );

      // Tell every user about the users
      // currently inside the room
      clients.forEach((clientId) => {
        io.to(clientId).emit(
          "user-join",
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
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
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
