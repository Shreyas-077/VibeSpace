import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered'],
        default: 'sent'
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;