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
let doc;
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New Client connected");
  socket.emit("hello", doc);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
  socket.on("saveData", (data) => {
    doc = data;
  });
  socket.on("getData", () => {
    console.log("getData");
    console.log(doc);
    socket.emit("receiveDocument", doc);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
