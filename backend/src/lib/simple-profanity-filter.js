class SimpleProfanityFilter {
    constructor() {
        // Initialize without external dependencies first
        this.profanityWords = new Set([
            // Strong profanity
            'shit', 'fuck', 'bitch', 'damn', 'hell', 'ass', 'crap',
            // Mild profanity and toxic terms
            'stupid', 'idiot', 'moron', 'dumb', 'retard', 'gay', 'fag',
            'hate', 'kill', 'die', 'suck', 'sucks', 'loser', 'noob',
            // Internet slang profanity
            'stfu', 'wtf', 'omfg', 'gtfo', 'kys', 'fml', 'pos',
            // Gaming toxicity
            'scrub', 'trash', 'garbage', 'pathetic', 'failure', 'worthless', 'useless',
            // Hate speech indicators
            'nazi', 'hitler', 'terrorist', 'cancer'
        ]);
        
        this.config = {
            strictMode: false,
            toxicityThreshold: 0.3, // Lowered threshold for better detection
            sentimentThreshold: -3,
            enableAIAnalysis: true,
            customWords: [],
            whitelistedWords: [],
            filterModes: {
                ASTERISK: 'asterisk',
                REPLACE: 'replace',
                BLOCK: 'block',
                WARN: 'warn'
            },
            currentMode: 'asterisk'
        };

        this.toxicPatterns = [
            /\b(kill\s+yourself|kys)\b/gi,
            /\b(go\s+die|die\s+in)\b/gi,
            /\b(hate\s+you|i\s+hate)\b/gi,
            /\b(stupid|idiot|moron)\s+(you|u)\b/gi,
            /\b(shut\s+up|stfu)\b/gi
        ];

        this.replacements = {
            // Basic replacements
            'stupid': 'silly', 'dumb': 'confused', 'idiot': 'person', 'moron': 'person',
            'hate': 'dislike', 'suck': 'are not good', 'sucks': 'is not good',
            'crap': 'stuff', 'damn': 'darn', 'hell': 'heck',
            // Strong profanity
            'shit': 'shoot', 'fuck': 'fudge', 'bitch': 'person', 'ass': 'butt',
            // Gaming terms
            'noob': 'beginner', 'scrub': 'player', 'trash': 'not good', 'garbage': 'bad',
            'loser': 'person', 'pathetic': 'sad', 'failure': 'person', 'worthless': 'person',
            'useless': 'unhelpful',
            // Internet slang
            'stfu': 'be quiet', 'wtf': 'what', 'omfg': 'oh my', 'gtfo': 'go away',
            'kys': 'take care', 'fml': 'oh no', 'pos': 'person'
        };
    }

    // Normalize text to handle obfuscation
    normalizeText(text) {
        let normalized = text.toLowerCase();
        
        // Handle leetspeak
        const leetMap = {
            '@': 'a', '4': 'a', '3': 'e', '0': 'o', '$': 's', '5': 's', '7': 't'
            // Removed '1': 'i' and '!': 'i' to prevent false positives
        };
        
        Object.entries(leetMap).forEach(([leet, letter]) => {
            const regex = new RegExp(leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            normalized = normalized.replace(regex, letter);
        });

        // Remove excessive punctuation
        normalized = normalized.replace(/[!@#$%^&*()_+={}|:"<>?[\]\\;',./`~]{2,}/g, ' ');
        
        // Remove single punctuation marks but keep letters
        normalized = normalized.replace(/[!@#$%^&*()_+={}|:"<>?[\]\\;',./`~]/g, '');
        
        // Handle repeated characters
        normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
        
        return normalized.trim();
    }

    // Simple sentiment analysis
    analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'awesome', 'nice', 'love', 'like', 'amazing', 'wonderful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'stupid', 'suck'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 2;
        });
        
        return {
            score,
            comparative: score / words.length,
            isNegative: score < this.config.sentimentThreshold
        };
    }

    // Detect contextual toxicity
    detectContextualToxicity(text) {
        const normalizedText = this.normalizeText(text);
        let toxicityScore = 0;
        const detectedPatterns = [];

        // Check against toxic patterns
        this.toxicPatterns.forEach((pattern, index) => {
            if (pattern.test(normalizedText)) {
                toxicityScore += 0.8;
                detectedPatterns.push(`toxic_pattern_${index}`);
            }
        });

        // Check for personal attacks
        if (/\byou\s+(are|'re)\s+/i.test(text)) {
            const sentiment = this.analyzeSentiment(text);
            if (sentiment.isNegative) {
                toxicityScore += 0.4;
                detectedPatterns.push('personal_attack');
            }
        }

        return {
            score: Math.min(toxicityScore, 1.0),
            patterns: detectedPatterns,
            isToxic: toxicityScore > this.config.toxicityThreshold
        };
    }

    // Check if text contains profanity
    hasProfanity(text) {
        const normalized = this.normalizeText(text);
        const words = normalized.split(/\s+/);
        
        return words.some(word => {
            // Check exact matches first
            if (this.profanityWords.has(word)) return true;
            
            // More careful partial matching - only for very obvious cases
            // Avoid common false positives like "hello" containing "hell"
            const safeWords = ['hello', 'help', 'shell', 'smell', 'tell', 'well', 'bell'];
            if (safeWords.includes(word)) return false;
            
            // Check partial matches for longer profanity words (5+ chars)
            return Array.from(this.profanityWords).some(profanity => 
                profanity.length >= 5 && word.length >= 5 && word.includes(profanity)
            );
        });
    }

    // Main analysis function
    analyzeText(text) {
        const normalizedText = this.normalizeText(text);
        const hasProfanity = this.hasProfanity(text);
        const sentiment = this.analyzeSentiment(text);
        const toxicity = this.detectContextualToxicity(text);
        
        // Calculate overall risk score
        const riskScore = this.calculateRiskScore({
            hasProfanity,
            sentiment: sentiment.score,
            toxicity: toxicity.score
        });

        return {
            originalText: text,
            normalizedText,
            hasProfanity,
            sentiment,
            toxicity,
            riskScore,
            shouldFilter: riskScore > 0.3, // Lowered from 0.5 for more sensitive filtering
            severity: this.getSeverityLevel(riskScore),
            confidence: this.calculateConfidence(riskScore, sentiment, toxicity)
        };
    }

    calculateRiskScore({ hasProfanity, sentiment, toxicity }) {
        let score = 0;
        
        // More aggressive scoring for profanity
        if (hasProfanity) score += 0.8; // Increased from 0.4
        if (sentiment < -2) score += 0.4; // Increased from 0.3
        score += toxicity * 0.6; // Increased from 0.5
        
        return Math.min(score, 1.0);
    }

    getSeverityLevel(riskScore) {
        if (riskScore >= 0.8) return 'severe';
        if (riskScore >= 0.6) return 'moderate';
        if (riskScore >= 0.3) return 'mild';
        return 'clean';
    }

    calculateConfidence(riskScore, sentiment, toxicity) {
        const factors = [
            riskScore > 0.7 ? 0.9 : 0.6,
            Math.abs(sentiment.score) > 3 ? 0.8 : 0.5,
            toxicity.patterns.length > 0 ? 0.9 : 0.4
        ];
        
        return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    }

    // Clean text by replacing profanity
    cleanText(text) {
        let cleaned = text;
        
        // Replace with alternatives first
        Object.entries(this.replacements).forEach(([bad, good]) => {
            const regex = new RegExp(`\\b${bad}\\b`, 'gi');
            cleaned = cleaned.replace(regex, good);
        });
        
        // Replace remaining profanity with asterisks
        Array.from(this.profanityWords).forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '*'.repeat(word.length));
        });
        
        return cleaned;
    }

    // Filter text based on analysis
    filterText(text, options = {}) {
        const analysis = this.analyzeText(text);
        const mode = options.mode || this.config.currentMode;
        
        if (!analysis.shouldFilter) {
            return {
                filteredText: text,
                wasFiltered: false,
                analysis
            };
        }

        let filteredText = text;
        
        switch (mode) {
            case this.config.filterModes.ASTERISK:
                filteredText = this.cleanText(text);
                break;
                
            case this.config.filterModes.REPLACE:
                filteredText = this.replaceWithAlternatives(text, analysis);
                break;
                
            case this.config.filterModes.BLOCK:
                return {
                    filteredText: null,
                    wasFiltered: true,
                    blocked: true,
                    analysis,
                    reason: 'Message blocked due to inappropriate content'
                };
                
            case this.config.filterModes.WARN:
                return {
                    filteredText: text,
                    wasFiltered: false,
                    warning: true,
                    analysis,
                    reason: 'Message contains potentially inappropriate content'
                };
        }

        return {
            filteredText,
            wasFiltered: true,
            analysis
        };
    }

    replaceWithAlternatives(text, analysis) {
        let result = text;
        Object.entries(this.replacements).forEach(([bad, good]) => {
            const regex = new RegExp(`\\b${bad}\\b`, 'gi');
            result = result.replace(regex, good);
        });
        return result;
    }

    // Update model configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Add words to whitelist
    addToWhitelist(words) {
        if (Array.isArray(words)) {
            this.config.whitelistedWords.push(...words);
            words.forEach(word => this.profanityWords.delete(word.toLowerCase()));
        } else {
            this.config.whitelistedWords.push(words);
            this.profanityWords.delete(words.toLowerCase());
        }
    }

    // Add custom profanity words
    addCustomWords(words) {
        if (Array.isArray(words)) {
            this.config.customWords.push(...words);
            words.forEach(word => this.profanityWords.add(word.toLowerCase()));
        } else {
            this.config.customWords.push(words);
            this.profanityWords.add(words.toLowerCase());
        }
    }

    // Get model statistics
    getStats() {
        return {
            customWords: this.config.customWords.length,
            whitelistedWords: this.config.whitelistedWords.length,
            currentMode: this.config.currentMode,
            strictMode: this.config.strictMode,
            toxicityThreshold: this.config.toxicityThreshold,
            totalProfanityWords: this.profanityWords.size
        };
    }

    // Train with new data
    trainWithNewData(messages) {
        console.log(`Training with ${messages.length} messages`);
        // For now, just log the training data
        // In a real implementation, this would update the model
    }
}

export default SimpleProfanityFilter;
