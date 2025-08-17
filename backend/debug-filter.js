import SimpleProfanityFilter from './src/lib/simple-profanity-filter.js';

// Debug test for "Hello everyone!"
const filter = new SimpleProfanityFilter();

const testText = "Hello everyone!";
console.log('Debugging:', testText);

// Check each component
const hasProfanity = filter.hasProfanity(testText);
const sentiment = filter.analyzeSentiment(testText);
const toxicity = filter.detectContextualToxicity(testText);

console.log('Has Profanity:', hasProfanity);
console.log('Sentiment:', sentiment);
console.log('Toxicity:', toxicity);

const riskScore = filter.calculateRiskScore({
    hasProfanity,
    sentiment: sentiment.score,
    toxicity: toxicity.score
});

console.log('Risk Score:', riskScore);
console.log('Should Filter:', riskScore > 0.3);
