import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getFilterStats,
    updateFilterConfig,
    addCustomWords,
    testFilter,
    getFilteredMessages,
    trainWithFeedback,
    analyzeMessage
} from "../controllers/filter.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get filter statistics and configuration
router.get("/stats", getFilterStats);

// Update filter configuration
router.put("/config", updateFilterConfig);

// Add custom words (profanity or whitelist)
router.post("/words", addCustomWords);

// Test the filter with sample text
router.post("/test", testFilter);

// Get filtered messages for admin review
router.get("/messages", getFilteredMessages);

// Train the model with feedback
router.post("/train", trainWithFeedback);

// Analyze a specific message
router.get("/analyze/:messageId", analyzeMessage);

export default router;
