import SimpleProfanityFilter from './src/lib/simple-profanity-filter.js';

// Test the improved AI profanity filter
const filter = new SimpleProfanityFilter();

console.log('🤖 Improved AI Profanity Filter Test\n');
console.log('=' * 50);

const testMessages = [
    'Hello everyone!',
    'ass',
    'noob',
    'stfu',
    'you are stupid',
    'this sucks',
    'damn it',
    'shit happens',
    'kill yourself',
    'you idiot'
];

testMessages.forEach((message, index) => {
    console.log(`\n--- Test ${index + 1}: "${message}" ---`);
    
    const result = filter.filterText(message);
    
    console.log(`Filtered: "${result.filteredText}"`);
    console.log(`Was Filtered: ${result.wasFiltered}`);
    console.log(`Blocked: ${result.blocked || false}`);
    console.log(`Severity: ${result.analysis.severity}`);
    console.log(`Risk Score: ${(result.analysis.riskScore * 100).toFixed(1)}%`);
    console.log(`Should Filter: ${result.analysis.shouldFilter}`);
});

console.log('\n' + '=' * 50);
console.log('Filter Statistics:', filter.getStats());
