import { Handler, HandlerEvent } from '@netlify/functions';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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
    const body = event.body ? JSON.parse(event.body) : {};
    const { socket_id, channel_name, user_name } = body;

    if (!socket_id || !channel_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    // Generate a unique user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Presence channel authentication
    const presenceData = {
      user_id: userId,
      user_info: {
        name: user_name || 'مستخدم',
      },
    };

    const authResponse = pusher.authorizeChannel(socket_id, channel_name, presenceData);

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
    console.error('Pusher auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
