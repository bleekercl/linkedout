import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';

// Stricter endpoint validation
const ALLOWED_ENDPOINTS = [
  'linkout_messages',
  'messages',
  'linkedout/message',
  'linkedout/generate-draft',
  'linkedout/snippets',
  'auth/login',
  'auth-with-password',
  'api/collections/_superusers/auth-with-password'
] as const;

const endpointSchema = z.enum(ALLOWED_ENDPOINTS);

// Add request schemas
const messageSchema = z.object({
  content: z.string().min(1),
  threadId: z.string(),
  chatId: z.string().optional(),
});

const generateDraftSchema = z.object({
  toFullName: z.string(),
  messageToReplyTo: z.string(),
  messageCategory: z.string(),
});

// Validate request body based on endpoint
const validateBody = (endpoint: string, body: unknown) => {
  switch(endpoint) {
    case 'messages':
      return messageSchema.parse(body);
    case 'linkedout/generate-draft':
      return generateDraftSchema.parse(body);
    default:
      return body;
  }
};

export async function POST(request: Request) {
  const headersList = headers();
  const token = headersList.get('authorization');
  const contentType = headersList.get('content-type');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check content type
  if (contentType !== 'application/json') {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }

  try {
    // Handle empty body requests
    let body = {};
    if (request.headers.get('content-length') !== '0') {
      body = await request.json();
    }
    
    const endpoint = request.headers.get('x-endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    let n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
    if (n8nUrl.includes("localhost") || n8nUrl.includes("127.0.0.1")) {
      n8nUrl = n8nUrl.replace("localhost", "n8n").replace("127.0.0.1", "n8n");
    }

    const response = await fetch(`${n8nUrl}/webhook/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // First try to get the response as text
    const responseText = await response.text();

    // Try to parse as JSON, if it fails, return the text
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      // If it's not JSON, return the text response
      return new NextResponse(responseText, { 
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const headersList = headers();
  const token = headersList.get('authorization');
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  try {
    let n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
    if (n8nUrl.includes("localhost") || n8nUrl.includes("127.0.0.1")) {
      n8nUrl = n8nUrl.replace("localhost", "n8n").replace("127.0.0.1", "n8n");
    }

    const response = await fetch(`${n8nUrl}/webhook/${endpoint}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}