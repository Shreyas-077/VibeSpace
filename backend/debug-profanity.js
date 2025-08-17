import SimpleProfanityFilter from './src/lib/simple-profanity-filter.js';

// Debug profanity detection
const filter = new SimpleProfanityFilter();

const testText = "Hello everyone!";
const normalized = filter.normalizeText(testText);
const words = normalized.split(/\s+/);

console.log('Original:', testText);
console.log('Normalized:', normalized);
console.log('Words:', words);
console.log('Profanity words:', Array.from(filter.profanityWords));

words.forEach(word => {
    console.log(`\nChecking word: "${word}"`);
    
    // Check exact matches
    if (filter.profanityWords.has(word)) {
        console.log(`  ✓ Exact match found!`);
        return;
    }
    
    // Check safe words
    const safeWords = ['hello', 'help', 'shell', 'smell', 'tell', 'well', 'bell'];
    if (safeWords.includes(word)) {
        console.log(`  ✓ Safe word - skipping partial matching`);
        return;
    }
    
    // Check partial matches
    const partialMatches = Array.from(filter.profanityWords).filter(profanity => 
        profanity.length >= 5 && word.length >= 5 && word.includes(profanity)
    );
    
    if (partialMatches.length > 0) {
        console.log(`  ✓ Partial matches found:`, partialMatches);
    } else {
        console.log(`  ✓ No matches found`);
    }
});
