const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const cors = require("cors");

const app = express();
app.use(index);
app.use(cors());
app.set("port", port);

const server = http.createServer(app);

let currentDoc;

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log(`Client: ${socket.id} disconnected`);
  });
  socket.on("hello", () => {
    console.log(`New Client: ${socket.id} connected`);
    socket.emit("init", currentDoc);
  });
  socket.on("update", (data) => {
    const { version, steps, clientId, doc } = data;
    currentDoc = doc;
    socket.broadcast.emit("updateDoc", {
      version,
      steps,
      clientId,
      doc,
    });
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
