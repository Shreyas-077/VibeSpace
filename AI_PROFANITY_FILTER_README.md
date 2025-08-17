# 🤖 AI Profanity Filter for VibeSpace Chat App

## Overview

This AI-powered profanity filter system provides comprehensive content moderation for your chat application. It uses natural language processing, sentiment analysis, and pattern recognition to detect and filter inappropriate content in real-time.

## Features

### 🧠 AI-Powered Analysis
- **Sentiment Analysis**: Analyzes the emotional tone of messages
- **Contextual Toxicity Detection**: Identifies harmful patterns and personal attacks
- **Obfuscation Handling**: Detects leetspeak and character substitutions
- **Risk Scoring**: Calculates confidence levels for filtering decisions

### 🛡️ Multiple Filter Modes
1. **Asterisk Mode**: Replaces profanity with asterisks (`bad word` → `*** word`)
2. **Replace Mode**: Substitutes with appropriate alternatives (`stupid` → `silly`)
3. **Block Mode**: Completely blocks inappropriate messages
4. **Warn Mode**: Allows messages but sends warnings to users

### ⚙️ Configurable Settings
- **Toxicity Threshold**: Adjustable sensitivity (0.0 - 1.0)
- **Sentiment Threshold**: Control negative sentiment detection
- **Strict Mode**: Enhanced filtering for stricter environments
- **Custom Word Lists**: Add your own profanity or whitelist words

### 📊 Real-time Analytics
- Filter statistics and effectiveness metrics
- Message severity classification (clean, mild, moderate, severe)
- Confidence scoring for filter decisions
- Admin dashboard for monitoring and management

## Installation

The AI profanity filter is already installed and configured in your project with the following packages:

```bash
npm install natural compromise sentiment bad-words ml-matrix
```

## API Endpoints

### Filter Administration (`/api/filter/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats` | GET | Get filter statistics and configuration |
| `/config` | PUT | Update filter configuration |
| `/words` | POST | Add custom words to profanity or whitelist |
| `/test` | POST | Test the filter with sample text |
| `/messages` | GET | Get filtered messages for admin review |
| `/train` | POST | Train the model with feedback |
| `/analyze/:messageId` | GET | Analyze a specific message |

### Example Requests

#### Test the Filter
```javascript
POST /api/filter/test
{
  "text": "This is a test message"
}
```

#### Update Configuration
```javascript
PUT /api/filter/config
{
  "strictMode": true,
  "toxicityThreshold": 0.8,
  "filterMode": "replace"
}
```

#### Add Custom Words
```javascript
POST /api/filter/words
{
  "words": ["newbadword", "anotherbadword"],
  "type": "profanity"
}
```

## Environment Configuration

Add these variables to your `.env` file:

```env
# AI Profanity Filter Configuration
STRICT_MODE=false
TOXICITY_THRESHOLD=0.7
SENTIMENT_THRESHOLD=-3
FILTER_MODE=asterisk
ENABLE_AI_ANALYSIS=true
```

## How It Works

### 1. Text Analysis Pipeline
```
Input Text → Normalization → Sentiment Analysis → Toxicity Detection → Risk Scoring → Filter Decision
```

### 2. Detection Methods
- **Basic Profanity**: Direct word matching against profanity database
- **Pattern Recognition**: Regex patterns for toxic phrases
- **Sentiment Analysis**: Emotional tone evaluation
- **Context Analysis**: Understanding message intent and targets

### 3. Severity Levels
- **Clean**: No issues detected (0-29% risk)
- **Mild**: Minor concerns (30-59% risk)
- **Moderate**: Notable issues (60-79% risk)  
- **Severe**: Serious violations (80-100% risk)

## Integration

### Backend Integration
The filter is automatically integrated into:
- Message controller (`/api/msg/send`)
- Socket.io real-time messaging
- Database storage with filter analysis

### Frontend Integration
- Real-time filter notifications in chat
- Admin dashboard for filter management
- User warnings for inappropriate content

### Socket Events
```javascript
// Filter events emitted to clients
socket.on('messageBlocked', (data) => {
  // Handle blocked message
});

socket.on('messageFiltered', (data) => {
  // Handle filtered message
});

socket.on('messageWarning', (data) => {
  // Handle content warning
});
```

## Filter Effectiveness

Based on test results:
- ✅ Successfully detects and filters profanity
- ✅ Handles leetspeak and obfuscation attempts
- ✅ Identifies personal attacks and toxic patterns
- ✅ Provides severity classification
- ✅ Maintains context awareness

### Sample Test Results
```
"This is really stupid and I hate it" 
→ "This is really silly and I dislike it" (Filtered)

"You are such an idiot, go die"
→ "You are such an person, go ***" (Filtered, Severe)

"Kill yourself now"
→ "**** yourself now" (Filtered, Severe)
```

## Admin Features

### Filter Dashboard
Access the admin dashboard at `/filter-admin` to:
- View real-time filter statistics
- Configure filter settings
- Test filter with sample text
- Manage custom word lists
- Review filtered messages
- Train the model with feedback

### Configuration Options
- **Filter Mode**: Choose between asterisk, replace, block, or warn
- **Sensitivity**: Adjust toxicity and sentiment thresholds
- **Custom Words**: Add domain-specific profanity or whitelisted terms
- **Strict Mode**: Enhanced filtering for sensitive environments

## Performance Considerations

- **Low Latency**: Filtering adds minimal delay to message sending
- **Scalable**: Designed to handle high-volume chat applications
- **Memory Efficient**: Optimized word matching and pattern recognition
- **Customizable**: Easily adjusted for different use cases

## Security Features

- **Filter Bypass Protection**: Multiple detection methods prevent evasion
- **Admin-Only Configuration**: Sensitive settings require authentication
- **Audit Trail**: All filter actions are logged for review
- **Privacy Preservation**: Original messages stored securely for admin review only

## Future Enhancements

1. **Machine Learning Training**: Improve accuracy with user feedback
2. **Multi-language Support**: Extend filtering to other languages
3. **Context-Aware Filtering**: Better understanding of conversation context
4. **Image Content Analysis**: OCR-based text extraction from images
5. **Automated Moderation Actions**: Temporary bans for repeat offenders

## Support and Maintenance

The AI profanity filter is designed to be:
- **Self-maintaining**: Continuously learns from new patterns
- **Easily configurable**: Admin-friendly interface for adjustments
- **Extensible**: Simple to add new detection methods
- **Reliable**: Graceful fallbacks if components fail

For technical support or feature requests, refer to the project documentation or contact the development team.

---

**Note**: This AI profanity filter is designed to create a safer, more welcoming chat environment while preserving the natural flow of conversation. Regular monitoring and adjustment of settings may be required to maintain optimal performance for your specific community.
