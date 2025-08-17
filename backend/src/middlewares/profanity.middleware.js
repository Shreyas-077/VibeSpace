const AIProfanityFilter = require('../lib/ai-profanity-filter');

class ProfanityFilterMiddleware {
    constructor() {
        this.aiFilter = new AIProfanityFilter();
        this.filterStats = {
            totalMessages: 0,
            filteredMessages: 0,
            blockedMessages: 0,
            warningMessages: 0
        };
        
        // Load configuration from environment or default
        this.loadConfiguration();
    }

    loadConfiguration() {
        const config = {
            strictMode: process.env.STRICT_MODE === 'true' || false,
            toxicityThreshold: parseFloat(process.env.TOXICITY_THRESHOLD) || 0.7,
            sentimentThreshold: parseInt(process.env.SENTIMENT_THRESHOLD) || -3,
            filterMode: process.env.FILTER_MODE || 'asterisk',
            enableAIAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false'
        };
        
        this.aiFilter.updateConfig(config);
    }

    // Middleware function for message filtering
    filterMessage = async (req, res, next) => {
        try {
            const { text } = req.body;
            
            if (!text || typeof text !== 'string') {
                return next();
            }

            this.filterStats.totalMessages++;

            // Analyze and filter the message
            const result = this.aiFilter.filterText(text);
            
            // Handle different outcomes
            if (result.blocked) {
                this.filterStats.blockedMessages++;
                return res.status(400).json({
                    success: false,
                    message: result.reason,
                    severity: result.analysis.severity,
                    confidence: result.analysis.confidence
                });
            }

            if (result.warning) {
                this.filterStats.warningMessages++;
                // Add warning to response but continue
                req.messageWarning = {
                    message: result.reason,
                    analysis: result.analysis
                };
            }

            if (result.wasFiltered) {
                this.filterStats.filteredMessages++;
                req.body.text = result.filteredText;
                req.filteredContent = {
                    original: text,
                    filtered: result.filteredText,
                    analysis: result.analysis
                };
            }

            // Add analysis data to request for logging
            req.aiAnalysis = result.analysis;
            
            next();
        } catch (error) {
            console.error('Error in profanity filter middleware:', error);
            // Continue without filtering if there's an error
            next();
        }
    };

    // Real-time message filtering for Socket.IO
    filterSocketMessage = (socket, data, callback) => {
        try {
            if (!data.text || typeof data.text !== 'string') {
                return callback(null, data);
            }

            const result = this.aiFilter.filterText(data.text);
            
            if (result.blocked) {
                // Emit warning to sender
                socket.emit('messageBlocked', {
                    reason: result.reason,
                    severity: result.analysis.severity,
                    originalMessage: data.text
                });
                return callback(new Error('Message blocked'), null);
            }

            if (result.warning) {
                // Emit warning to sender
                socket.emit('messageWarning', {
                    reason: result.reason,
                    analysis: result.analysis
                });
            }

            if (result.wasFiltered) {
                data.text = result.filteredText;
                data.wasFiltered = true;
                data.filterAnalysis = result.analysis;
            }

            callback(null, data);
        } catch (error) {
            console.error('Error in socket message filter:', error);
            callback(null, data); // Continue without filtering on error
        }
    };

    // Get filter statistics
    getStats() {
        return {
            ...this.filterStats,
            filterRate: this.filterStats.totalMessages > 0 
                ? (this.filterStats.filteredMessages / this.filterStats.totalMessages * 100).toFixed(2)
                : 0,
            blockRate: this.filterStats.totalMessages > 0
                ? (this.filterStats.blockedMessages / this.filterStats.totalMessages * 100).toFixed(2)
                : 0,
            modelStats: this.aiFilter.getStats()
        };
    }

    // Admin functions for managing the filter
    updateFilterMode(mode) {
        const validModes = ['asterisk', 'replace', 'block', 'warn'];
        if (validModes.includes(mode)) {
            this.aiFilter.updateConfig({ currentMode: mode });
            return true;
        }
        return false;
    }

    updateToxicityThreshold(threshold) {
        if (threshold >= 0 && threshold <= 1) {
            this.aiFilter.updateConfig({ toxicityThreshold: threshold });
            return true;
        }
        return false;
    }

    addCustomWords(words) {
        this.aiFilter.addCustomWords(words);
    }

    addToWhitelist(words) {
        this.aiFilter.addToWhitelist(words);
    }

    // Train the model with user feedback
    trainWithFeedback(messages) {
        this.aiFilter.trainWithNewData(messages);
    }

    // Reset statistics
    resetStats() {
        this.filterStats = {
            totalMessages: 0,
            filteredMessages: 0,
            blockedMessages: 0,
            warningMessages: 0
        };
    }
}

// Create a singleton instance
const profanityFilterMiddleware = new ProfanityFilterMiddleware();

module.exports = profanityFilterMiddleware;
