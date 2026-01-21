
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const activeCalls = {};

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined");
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("call-started", ({ roomId }) => {
    activeCalls[roomId] = Date.now();
  });

  socket.on("call-ended", ({ roomId }) => {
    if (activeCalls[roomId]) {
      const duration = Math.ceil((Date.now() - activeCalls[roomId]) / 60000);
      socket.to(roomId).emit("call-duration", { minutes: duration });
      delete activeCalls[roomId];
    }
  });
});

server.listen(5000, () => console.log("Server running on 5000"));
