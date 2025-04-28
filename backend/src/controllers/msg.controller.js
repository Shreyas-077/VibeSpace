import User from "../models/users.js";
import Message from "../models/messages.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersBySideBar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // First, get all messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Mark all messages from the other user as delivered
    const undeliveredMessages = messages.filter(
      message => message.senderId === userToChatId && message.status === 'sent'
    );

    if (undeliveredMessages.length > 0) {
      // Update status to delivered for all undelivered messages
      await Message.updateMany(
        {
          _id: { $in: undeliveredMessages.map(msg => msg._id) }
        },
        {
          $set: { status: 'delivered' }
        }
      );

      // Update the messages array to reflect the new status
      messages.forEach(message => {
        if (message.senderId === userToChatId && message.status === 'sent') {
          message.status = 'delivered';
        }
      });

      // Notify the sender that their messages were delivered
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        undeliveredMessages.forEach(message => {
          io.to(senderSocketId).emit("messageStatus", {
            messageId: message._id,
            status: 'delivered'
          });
        });
      }
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
      const { text, image } = req.body;
      const { id: receiverId } = req.params;
      const senderId = req.user._id;

      let imageUrl;
      if (image) {
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = uploadResponse.secure_url;
      }

      const newMessage = new Message({
          senderId,
          receiverId,
          text,
          image: imageUrl,
          status: 'sent'  // Default status when message is created
      });

      await newMessage.save();

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
          // Update status to delivered if receiver is online
          newMessage.status = 'delivered';
          await newMessage.save();
      }

      res.status(201).json(newMessage);
  } catch (error) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
  }
};