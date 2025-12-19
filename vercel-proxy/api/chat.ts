// Spend & Send - Vercel Proxy for Claude API
//
// This serverless function proxies requests to the Claude API,
// keeping your API key secure on the server side.
//
// Deploy this to Vercel and use the URL in your mobile app.

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// Types
// ============================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  model?: string;
  system?: string;
  messages: Message[];
  max_tokens?: number;
}

// ============================================
// Handler
// ============================================

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 1024,
      system: body.system || '',
      messages: body.messages,
    });

    // Return response
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        } 
      }
    );
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({ 
          error: 'Claude API error',
          message: error.message,
          status: error.status,
        }),
        { status: error.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
