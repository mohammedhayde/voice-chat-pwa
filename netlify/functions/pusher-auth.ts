import { Handler, HandlerEvent } from '@netlify/functions';
import Pusher from 'pusher';

// Log environment variables check (without exposing values)
console.log('🔍 [INIT] Checking environment variables...');
console.log('✓ PUSHER_APP_ID:', process.env.PUSHER_APP_ID ? 'SET ✅' : 'MISSING ❌');
console.log('✓ PUSHER_SECRET:', process.env.PUSHER_SECRET ? 'SET ✅' : 'MISSING ❌');
console.log('✓ NEXT_PUBLIC_PUSHER_KEY:', process.env.NEXT_PUBLIC_PUSHER_KEY ? 'SET ✅' : 'MISSING ❌');
console.log('✓ NEXT_PUBLIC_PUSHER_CLUSTER:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu (default)');

// Initialize Pusher
console.log('🔧 [INIT] Initializing Pusher client...');
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  useTLS: true,
});
console.log('✅ [INIT] Pusher client initialized');

export const handler: Handler = async (event: HandlerEvent) => {
  console.log('\n========================================');
  console.log('🚀 [REQUEST] New request received');
  console.log('📍 Method:', event.httpMethod);
  console.log('📍 Path:', event.path);
  console.log('========================================\n');

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ [ERROR] Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json',
      },
    };
  }

  try {
    console.log('📦 [PARSE] Parsing request body...');
    console.log('📦 [PARSE] Content-Type:', event.headers['content-type']);
    console.log('📦 [PARSE] Raw body:', event.body?.substring(0, 100));

    // Parse body based on content type
    let body: any = {};
    const contentType = event.headers['content-type'] || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      console.log('📦 [PARSE] Detected URL-encoded data');
      // Parse URL-encoded data: socket_id=123&channel_name=room&user_name=name
      const params = new URLSearchParams(event.body || '');
      body = {
        socket_id: params.get('socket_id'),
        channel_name: params.get('channel_name'),
        user_name: params.get('user_name'),
      };
    } else if (contentType.includes('application/json')) {
      console.log('📦 [PARSE] Detected JSON data');
      body = event.body ? JSON.parse(event.body) : {};
    } else {
      console.log('⚠️ [PARSE] Unknown content type, trying both formats...');
      try {
        body = event.body ? JSON.parse(event.body) : {};
      } catch {
        const params = new URLSearchParams(event.body || '');
        body = {
          socket_id: params.get('socket_id'),
          channel_name: params.get('channel_name'),
          user_name: params.get('user_name'),
        };
      }
    }

    console.log('📦 [PARSE] Body keys:', Object.keys(body));

    const { socket_id, channel_name, user_name } = body;
    console.log('📝 [DATA] socket_id:', socket_id ? 'present' : 'MISSING');
    console.log('📝 [DATA] channel_name:', channel_name || 'MISSING');
    console.log('📝 [DATA] user_name:', user_name || 'not provided');

    if (!socket_id || !channel_name) {
      console.log('❌ [ERROR] Missing required parameters');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    // Generate a unique user ID
    console.log('🔑 [AUTH] Generating user ID...');
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔑 [AUTH] User ID generated:', userId);

    // Presence channel authentication
    console.log('👤 [AUTH] Creating presence data...');
    const presenceData = {
      user_id: userId,
      user_info: {
        name: user_name || 'مستخدم',
      },
    };
    console.log('👤 [AUTH] Presence data created');

    console.log('🔐 [AUTH] Authorizing channel with Pusher...');
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, presenceData);
    console.log('✅ [AUTH] Authorization successful!');
    console.log('📤 [RESPONSE] Auth keys:', Object.keys(authResponse));

    console.log('✅ [SUCCESS] Returning 200 response\n');
    return {
      statusCode: 200,
      body: JSON.stringify(authResponse),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  } catch (error: any) {
    console.log('\n❌❌❌ [CRITICAL ERROR] ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        name: error.name
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
