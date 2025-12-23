# Spend & Send - Vercel Proxy

This is a serverless proxy for the Claude API that keeps your API key secure.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

For local development:
```bash
cp .env.example .env.local
# Edit .env.local with your Anthropic API key
```

For Vercel deployment:
```bash
vercel env add ANTHROPIC_API_KEY
# Enter your API key when prompted
```

### 3. Local Development

```bash
npm run dev
```

The proxy will be available at `http://localhost:3000/api/chat`

### 4. Deploy to Vercel

```bash
npm run deploy
```

## API Usage

### POST /api/chat

Send a message to Claude.

**Request:**
```json
{
  "model": "claude-sonnet-4-20250514",
  "system": "You are Spend & Send...",
  "messages": [
    { "role": "user", "content": "I spent $12 on lunch" }
  ],
  "max_tokens": 1024
}
```

**Response:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"message\": \"Logged: $12.00 — Lunch — Dining\", ...}"
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": { ... }
}
```

## Security Notes

- Never expose your Anthropic API key in client-side code
- The proxy handles all Claude API calls server-side
- CORS is configured to allow requests from any origin (adjust for production)
- Consider adding rate limiting for production use

