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
    },
    filterAnalysis: {
        wasFiltered: {
            type: Boolean,
            default: false
        },
        originalText: String,
        severity: {
            type: String,
            enum: ['clean', 'mild', 'moderate', 'severe']
        },
        confidence: Number,
        riskScore: Number,
        warning: String,
        analysis: {
            sentiment: Object,
            toxicity: Object,
            hasProfanity: Boolean
        }
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;