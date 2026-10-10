const { contextBridge } = require("electron");
const { io } = require("socket.io-client");

let socket = null;
const listeners = {
    status: [],
    message: [],
    count: [],
};

function notify(type, value) {
    if (!listeners[type]) return;

    listeners[type].forEach((callback) => {
        try {
            callback(value);
        } catch (error) {
            console.error(error);
        }
    });
}

contextBridge.exposeInMainWorld("chatAPI", {
    connect(url) {
        if (socket) socket.disconnect();

        socket = io(url, {
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: Infinity,
        });

        socket.on("connect", () => notify("status", "connected"));
        socket.on("disconnect", () => notify("status", "disconnected"));
        socket.on("connect_error", () => notify("status", "error"));

        socket.on("chat message", (message) => {
            notify("message", message);
        });

        socket.on("online count", (count) => {
            notify("count", count);
        });
    },

    sendMessage(username, text) {
        if (!socket || !socket.connected) return false;

        socket.emit("chat message", { username, text });
        return true;
    },

    onStatus(callback) {
        listeners.status.push(callback);
    },

    onMessage(callback) {
        listeners.message.push(callback);
    },

    onCount(callback) {
        listeners.count.push(callback);
    },

    disconnect() {
        if (socket) socket.disconnect();
    },
});