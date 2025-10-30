import { NextRequest, NextResponse } from 'next/server';

// Auth endpoint for Pusher private and presence channels
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');
    const userName = params.get('user_name') || 'مستخدم';

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Import Pusher server-side SDK
    const Pusher = (await import('pusher')).default;

    const pusher = new Pusher({
      appId: '2070639',
      key: '5b2029a10320bc0f6e04',
      secret: '612a6b234fd2f8b32a22',
      cluster: 'eu',
      useTLS: true,
    });

    // Check if this is a presence channel
    if (channelName.startsWith('presence-')) {
      // Generate unique user ID
      const userId = `${socketId}-${Date.now()}`;

      // Authorize presence channel with user info
      const presenceData = {
        user_id: userId,
        user_info: {
          name: userName,
        },
      };

      const auth = pusher.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(auth);
    } else {
      // Regular private channel
      const auth = pusher.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
