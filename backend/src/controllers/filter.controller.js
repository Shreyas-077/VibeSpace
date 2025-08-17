import SimpleProfanityFilter from "../lib/simple-profanity-filter.js";
import Message from "../models/messages.js";

// Initialize the AI profanity filter
const aiFilter = new SimpleProfanityFilter();

// Get filter statistics and configuration
export const getFilterStats = async (req, res) => {
    try {
        // Get basic stats from the filter
        const filterStats = aiFilter.getStats();
        
        // Get database statistics
        const totalMessages = await Message.countDocuments();
        const filteredMessages = await Message.countDocuments({
            'filterAnalysis.wasFiltered': true
        });
        const blockedMessagesAttempts = await Message.countDocuments({
            'filterAnalysis.severity': { $in: ['severe', 'moderate'] }
        });

        // Calculate percentages
        const filterRate = totalMessages > 0 ? ((filteredMessages / totalMessages) * 100).toFixed(2) : 0;
        
        // Get severity distribution
        const severityStats = await Message.aggregate([
            { $match: { 'filterAnalysis.severity': { $exists: true } } },
            { $group: { _id: '$filterAnalysis.severity', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                basic: filterStats,
                database: {
                    totalMessages,
                    filteredMessages,
                    blockedMessagesAttempts,
                    filterRate: `${filterRate}%`
                },
                severityDistribution: severityStats,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error("Error getting filter stats:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Update filter configuration
export const updateFilterConfig = async (req, res) => {
    try {
        const { 
            strictMode, 
            toxicityThreshold, 
            sentimentThreshold, 
            filterMode,
            enableAIAnalysis 
        } = req.body;

        const newConfig = {};
        
        if (strictMode !== undefined) newConfig.strictMode = strictMode;
        if (toxicityThreshold !== undefined) {
            if (toxicityThreshold < 0 || toxicityThreshold > 1) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Toxicity threshold must be between 0 and 1" 
                });
            }
            newConfig.toxicityThreshold = toxicityThreshold;
        }
        if (sentimentThreshold !== undefined) newConfig.sentimentThreshold = sentimentThreshold;
        if (filterMode !== undefined) {
            const validModes = ['asterisk', 'replace', 'block', 'warn'];
            if (!validModes.includes(filterMode)) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Invalid filter mode" 
                });
            }
            newConfig.currentMode = filterMode;
        }
        if (enableAIAnalysis !== undefined) newConfig.enableAIAnalysis = enableAIAnalysis;

        aiFilter.updateConfig(newConfig);

        res.status(200).json({
            success: true,
            message: "Filter configuration updated successfully",
            config: aiFilter.getStats()
        });
    } catch (error) {
        console.error("Error updating filter config:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Add custom words to the filter
export const addCustomWords = async (req, res) => {
    try {
        const { words, type } = req.body;

        if (!words || !Array.isArray(words)) {
            return res.status(400).json({ 
                success: false, 
                error: "Words must be provided as an array" 
            });
        }

        if (type === 'profanity') {
            aiFilter.addCustomWords(words);
        } else if (type === 'whitelist') {
            aiFilter.addToWhitelist(words);
        } else {
            return res.status(400).json({ 
                success: false, 
                error: "Type must be either 'profanity' or 'whitelist'" 
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully added ${words.length} words to ${type}`,
            stats: aiFilter.getStats()
        });
    } catch (error) {
        console.error("Error adding custom words:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Test the filter with sample text
export const testFilter = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ 
                success: false, 
                error: "Text is required for testing" 
            });
        }

        const result = aiFilter.filterText(text);

        res.status(200).json({
            success: true,
            originalText: text,
            result: {
                filteredText: result.filteredText,
                wasFiltered: result.wasFiltered,
                blocked: result.blocked,
                warning: result.warning,
                analysis: result.analysis
            }
        });
    } catch (error) {
        console.error("Error testing filter:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get filtered messages for review
export const getFilteredMessages = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            severity, 
            startDate, 
            endDate 
        } = req.query;

        const query = { 'filterAnalysis.wasFiltered': true };
        
        if (severity) {
            query['filterAnalysis.severity'] = severity;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const messages = await Message.find(query)
            .populate('senderId', 'fullName email')
            .populate('receiverId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Message.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                messages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalMessages: total,
                    hasNext: skip + messages.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error("Error getting filtered messages:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Train the model with feedback
export const trainWithFeedback = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                success: false, 
                error: "Messages array is required for training" 
            });
        }

        // Validate message format
        const validMessages = messages.filter(msg => 
            msg.text && 
            typeof msg.text === 'string' && 
            msg.label !== undefined &&
            (msg.label === 0 || msg.label === 1)
        );

        if (validMessages.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: "No valid training messages provided" 
            });
        }

        aiFilter.trainWithNewData(validMessages);

        res.status(200).json({
            success: true,
            message: `Successfully trained with ${validMessages.length} messages`,
            trainedCount: validMessages.length,
            totalProvided: messages.length
        });
    } catch (error) {
        console.error("Error training with feedback:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Get analysis for a specific message
export const analyzeMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId)
            .populate('senderId', 'fullName email')
            .populate('receiverId', 'fullName email');

        if (!message) {
            return res.status(404).json({ 
                success: false, 
                error: "Message not found" 
            });
        }

        // Re-analyze the message with current filter settings
        let currentAnalysis = null;
        if (message.text) {
            const result = aiFilter.filterText(message.text);
            currentAnalysis = result.analysis;
        }

        res.status(200).json({
            success: true,
            data: {
                message,
                originalAnalysis: message.filterAnalysis,
                currentAnalysis,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error("Error analyzing message:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
