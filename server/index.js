const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// 🔥 временное хранилище (в памяти)
let messages = [];

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);

    const roomMessages = messages.filter((m) => m.room === room);
    socket.emit("load_messages", roomMessages);
  });

  socket.on("send_message", (data) => {
    const newMsg = {
      ...data,
      _id: Date.now().toString(),
    };

    messages.push(newMsg);

    io.to(data.room).emit("receive_message", newMsg);
  });

  socket.on("delete_message", ({ id, room }) => {
    messages = messages.filter((m) => m._id !== id);
    io.to(room).emit("message_deleted", id);
  });

  socket.on("edit_message", ({ id, text, room }) => {
    messages = messages.map((m) =>
      m._id === id ? { ...m, message: text } : m
    );

    const updated = messages.find((m) => m._id === id);
    io.to(room).emit("message_edited", updated);
  });
});

server.listen(3001, () => {
  console.log("Server started on port 3001");
});