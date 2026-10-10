const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// endpoint to check if the server is running
app.get("/", (req, res) => {
    res.json({
        app: "Chat Kampus Server",
        status: "running",
    });
});

app.get("/health", (req, res) => {
    res.json({ status:  "ok" });
});

io.on("connection", (socket) => {
    console.log("a user connected:", socket.id);
    io.emit("online count", io.engine.clientsCount);

    let lastMessage = 0;

    socket.on("chat message", (data) => {
        if (!data || typeof data !== "object") return;

        const username =
         typeof data.username === "string" 
        ? data.username.trim().slice(0, 24)
        : "";

        const text =
         typeof data.text === "string"
        ? data.text.trim().slice(0, 500)
        : "";
        if (!username || !text) return;

        const now = Date.now();
        if (now - lastMessage < 400) return;
        lastMessage = now;

        io.emit("chat message", {
            username,
            text,
            time: new Date().toISOString(),
        });
    });

    socket.on("disconnect", () => {
        console.log("user disconnected:", socket.id);
        io.emit("online count", io.engine.clientsCount);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Chat Kampus Server active on port ${PORT}`);
});