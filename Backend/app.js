import "dotenv/config";
import express from "express";

import { createServer } from "node:http";
import { Server } from "socket.io";
import { connectToSocket } from "./controllers/socketManager.js";

import mongoose from "mongoose";
import cors from "cors";
import userRoute from "./routes/usersroutes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8080);

// Middlerware
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoute);


// Server run
const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Zoom");
  console.log("DB is connected");

  server.listen(app.get("port"), () => {
    console.log("Listening on 8080");
  });
};

start().catch((err) => {
  console.log(err);
});
