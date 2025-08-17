import { Server } from "socket.io";
import http from "http";
import express from "express";
import SimpleProfanityFilter from "./simple-profanity-filter.js";

const app = express();
const server = http.createServer(app);

// Initialize AI profanity filter for real-time messaging
const aiFilter = new SimpleProfanityFilter();

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Emit to all clients immediately after a new user connects
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Listen for new messages
  socket.on("newMessage", async (message) => {
    try {
      // Apply AI profanity filter if the message contains text
      if (message.text && message.text.trim() !== '') {
        const filterResult = aiFilter.filterText(message.text);
        
        // If message should be blocked
        if (filterResult.blocked) {
          socket.emit("messageBlocked", {
            reason: filterResult.reason,
            severity: filterResult.analysis.severity,
            originalMessage: message.text
          });
          return; // Don't send the message
        }

        // If message was filtered
        if (filterResult.wasFiltered) {
          message.text = filterResult.filteredText;
          socket.emit("messageFiltered", {
            originalText: message.text,
            filteredText: filterResult.filteredText,
            severity: filterResult.analysis.severity
          });
        }

        // If message has a warning
        if (filterResult.warning) {
          socket.emit("messageWarning", {
            reason: filterResult.reason,
            analysis: filterResult.analysis
          });
        }
      }

      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("messageReceived", {
          ...message,
          status: 'delivered'
        });
      }
    } catch (error) {
      console.error("Error filtering socket message:", error);
      // Continue with original message if filtering fails
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("messageReceived", {
          ...message,
          status: 'delivered'
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      // Emit updated online users list immediately after disconnect
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // Add heartbeat to keep connection alive
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

// Periodic cleanup of stale connections
setInterval(() => {
  io.sockets.emit("ping");
  setTimeout(() => {
    for (const [userId, socketId] of Object.entries(userSocketMap)) {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    }
  }, 5000);
}, 30000);

export { io, app, server };