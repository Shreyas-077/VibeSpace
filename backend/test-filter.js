import SimpleProfanityFilter from './src/lib/simple-profanity-filter.js';

// Test the AI profanity filter
const filter = new SimpleProfanityFilter();

console.log('🤖 AI Profanity Filter Test\n');
console.log('=' * 50);

const testMessages = [
    'Hello everyone, how are you doing today?',
    'This is really stupid and I hate it',
    'You are such an idiot, go die',
    'What the hell is wrong with you?',
    'That was amazing, great job!',
    'This sucks so bad',
    'I love this chat app',
    'Shut up you moron',
    'Kill yourself now',
    'Damn, that was close'
];

testMessages.forEach((message, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    console.log(`Original: "${message}"`);
    
    const result = filter.filterText(message);
    
    console.log(`Filtered: "${result.filteredText}"`);
    console.log(`Was Filtered: ${result.wasFiltered}`);
    console.log(`Blocked: ${result.blocked || false}`);
    console.log(`Severity: ${result.analysis.severity}`);
    console.log(`Risk Score: ${(result.analysis.riskScore * 100).toFixed(1)}%`);
    console.log(`Confidence: ${(result.analysis.confidence * 100).toFixed(1)}%`);
});

console.log('\n' + '=' * 50);
console.log('Filter Statistics:', filter.getStats());
