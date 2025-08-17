import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import CommonJS modules
const natural = require('natural');
const compromise = require('compromise');
const Sentiment = require('sentiment');
const Filter = require('bad-words');

class AIProfanityFilter {
    constructor() {
        this.sentiment = new Sentiment();
        this.filter = new Filter();
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        
        // Initialize the model components
        this.initializeModel();
        
        // Configuration
        this.config = {
            strictMode: false,
            toxicityThreshold: 0.7,
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
        
        // Add custom profanity patterns
        this.addCustomPatterns();
    }

    initializeModel() {
        // Initialize TF-IDF vectorizer for text analysis
        this.tfidf = new natural.TfIdf();
        
        // Profanity categories with severity scores
        this.profanityCategories = {
            mild: { weight: 0.3, replacement: '***' },
            moderate: { weight: 0.6, replacement: '****' },
            severe: { weight: 0.9, replacement: '*****' },
            hate_speech: { weight: 1.0, replacement: '[REMOVED]' }
        };

        // Context patterns that might indicate toxicity
        this.toxicPatterns = [
            /\b(kill\s+yourself|kys)\b/gi,
            /\b(go\s+die|die\s+in)\b/gi,
            /\b(hate\s+you|i\s+hate)\b/gi,
            /\b(stupid|idiot|moron)\s+(you|u)\b/gi,
            /\b(shut\s+up|stfu)\b/gi
        ];

        // Leetspeak and obfuscation patterns
        this.obfuscationPatterns = {
            'a': ['@', '4'],
            'e': ['3'],
            'i': ['1', '!'],
            'o': ['0'],
            's': ['$', '5'],
            't': ['7'],
            'l': ['1'],
            'f': ['ph']
        };

        this.trainModel();
    }

    trainModel() {
        // Training data for toxicity detection
        const trainingData = [
            { text: "you are amazing", label: 0 },
            { text: "great job everyone", label: 0 },
            { text: "thanks for helping", label: 0 },
            { text: "i hate this stupid thing", label: 1 },
            { text: "you are so dumb", label: 1 },
            { text: "shut up idiot", label: 1 },
            { text: "go kill yourself", label: 1 },
            { text: "that's really cool", label: 0 },
            { text: "you suck at this", label: 1 }
        ];

        // Train TF-IDF model
        trainingData.forEach(data => {
            this.tfidf.addDocument(data.text);
        });

        // Create feature vectors for training
        this.trainingVectors = trainingData.map((data, index) => {
            const vector = [];
            this.tfidf.listTerms(index).forEach(term => {
                vector.push(term.tfidf);
            });
            return { features: vector, label: data.label };
        });
    }

    addCustomPatterns() {
        // Add custom words to the filter
        const customProfanity = [
            'noob', 'scrub', 'trash', 'garbage', 'pathetic',
            'loser', 'failure', 'worthless', 'useless'
        ];
        
        this.filter.addWords(...customProfanity);
    }

    // Normalize text to handle obfuscation
    normalizeText(text) {
        let normalized = text.toLowerCase();
        
        // Handle leetspeak
        Object.entries(this.obfuscationPatterns).forEach(([letter, replacements]) => {
            replacements.forEach(replacement => {
                const regex = new RegExp(replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                normalized = normalized.replace(regex, letter);
            });
        });

        // Remove excessive punctuation
        normalized = normalized.replace(/[!@#$%^&*()_+={}|:"<>?[\]\\;',./`~]{2,}/g, ' ');
        
        // Handle repeated characters (e.g., "hellooooo" -> "hello")
        normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
        
        return normalized;
    }

    // Analyze text sentiment
    analyzeSentiment(text) {
        const result = this.sentiment.analyze(text);
        return {
            score: result.score,
            comparative: result.comparative,
            positive: result.positive,
            negative: result.negative,
            isNegative: result.score < this.config.sentimentThreshold
        };
    }

    // Detect context-based toxicity
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

        // Analyze with NLP
        const doc = compromise(text);
        
        // Check for aggressive language patterns
        if (doc.has('#Imperative')) {
            const imperatives = doc.match('#Imperative').text();
            if (imperatives.includes('shut') || imperatives.includes('stop') || imperatives.includes('die')) {
                toxicityScore += 0.3;
                detectedPatterns.push('aggressive_imperative');
            }
        }

        // Check for personal attacks
        if (doc.has('you are') || doc.has('you\'re')) {
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

    // Main AI analysis function
    analyzeText(text) {
        const normalizedText = this.normalizeText(text);
        
        // Basic profanity check
        const hasProfanity = this.filter.isProfane(normalizedText);
        
        // Sentiment analysis
        const sentiment = this.analyzeSentiment(text);
        
        // Contextual toxicity detection
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
            shouldFilter: riskScore > 0.5,
            severity: this.getSeverityLevel(riskScore),
            confidence: this.calculateConfidence(riskScore, sentiment, toxicity)
        };
    }

    calculateRiskScore({ hasProfanity, sentiment, toxicity }) {
        let score = 0;
        
        if (hasProfanity) score += 0.4;
        if (sentiment < -2) score += 0.3;
        score += toxicity * 0.5;
        
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
                filteredText = this.filter.clean(text);
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
        const alternatives = {
            'stupid': 'silly',
            'dumb': 'confused',
            'idiot': 'person',
            'hate': 'dislike',
            'suck': 'are not good',
            'crap': 'stuff',
            'damn': 'darn'
        };

        let result = text;
        Object.entries(alternatives).forEach(([bad, good]) => {
            const regex = new RegExp(`\\b${bad}\\b`, 'gi');
            result = result.replace(regex, good);
        });

        return this.filter.clean(result);
    }

    // Update model configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Add words to whitelist
    addToWhitelist(words) {
        if (Array.isArray(words)) {
            this.config.whitelistedWords.push(...words);
            this.filter.removeWords(...words);
        } else {
            this.config.whitelistedWords.push(words);
            this.filter.removeWords(words);
        }
    }

    // Add custom profanity words
    addCustomWords(words) {
        if (Array.isArray(words)) {
            this.config.customWords.push(...words);
            this.filter.addWords(...words);
        } else {
            this.config.customWords.push(words);
            this.filter.addWords(words);
        }
    }

    // Get model statistics
    getStats() {
        return {
            customWords: this.config.customWords.length,
            whitelistedWords: this.config.whitelistedWords.length,
            currentMode: this.config.currentMode,
            strictMode: this.config.strictMode,
            toxicityThreshold: this.config.toxicityThreshold
        };
    }

    // Train with new data
    trainWithNewData(messages) {
        messages.forEach(message => {
            if (message.text && message.label !== undefined) {
                this.tfidf.addDocument(message.text);
            }
        });
    }
}

export default AIProfanityFilter;
