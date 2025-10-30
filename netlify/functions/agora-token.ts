import { Handler, HandlerEvent } from '@netlify/functions';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

console.log('🎯 [AGORA TOKEN INIT] Initializing Agora Token Generator...');
console.log('🔑 [AGORA TOKEN INIT] App ID:', process.env.NEXT_PUBLIC_AGORA_APP_ID ? 'SET ✅' : 'MISSING ❌');
console.log('🔐 [AGORA TOKEN INIT] App Certificate:', process.env.AGORA_PRIMARY_CERTIFICATE ? 'SET ✅' : 'MISSING ❌');

export const handler: Handler = async (event: HandlerEvent) => {
  console.log('\n========================================');
  console.log('🎫 [TOKEN REQUEST] New token request');
  console.log('📍 Method:', event.httpMethod);
  console.log('📍 Path:', event.path);
  console.log('========================================\n');

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    console.log('❌ [ERROR] Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Allow': 'GET',
        'Content-Type': 'application/json',
      },
    };
  }

  try {
    // Get parameters from query string
    const params = event.queryStringParameters || {};
    const { channel, uid, role } = params;

    console.log('📦 [TOKEN] Request parameters:');
    console.log('  - Channel:', channel || 'MISSING');
    console.log('  - UID:', uid || 'MISSING');
    console.log('  - Role:', role || 'publisher (default)');

    // Validate required parameters
    if (!channel) {
      console.log('❌ [ERROR] Missing channel parameter');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: channel' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Get environment variables
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_PRIMARY_CERTIFICATE;

    console.log('🔍 [TOKEN] Checking environment variables...');
    console.log('  - App ID:', appId ? `${appId.substring(0, 8)}...` : '❌ MISSING');
    console.log('  - App Certificate:', appCertificate ? `${appCertificate.substring(0, 8)}...` : '❌ MISSING');

    if (!appId || !appCertificate) {
      console.error('❌ [ERROR] Missing environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Server configuration error',
          details: 'Missing AGORA credentials'
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Set token parameters
    const userUid = uid ? parseInt(uid) : 0; // 0 means auto-assign by Agora
    const userRole = role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    console.log('🔨 [TOKEN] Building token with:');
    console.log('  - User UID:', userUid);
    console.log('  - Role:', userRole === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER');
    console.log('  - Expire time:', new Date(privilegeExpireTime * 1000).toISOString());

    // Build the token
    console.log('⚙️ [TOKEN] Generating token...');
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      userUid,
      userRole,
      privilegeExpireTime,
      privilegeExpireTime
    );

    console.log('✅ [TOKEN] Token generated successfully!');
    console.log('📤 [TOKEN] Token length:', token.length, 'characters');
    console.log('🎉 [SUCCESS] Returning token\n');

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        appId,
        channel,
        uid: userUid,
        expireTime: privilegeExpireTime,
        expireAt: new Date(privilegeExpireTime * 1000).toISOString()
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
        error: 'Failed to generate token',
        details: error.message,
        name: error.name
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
