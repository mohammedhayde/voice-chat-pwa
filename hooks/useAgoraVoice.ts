import { useState, useEffect, useRef } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

export interface UseAgoraVoiceProps {
  appId: string;
  channel: string;
  token?: string;
}

export const useAgoraVoice = ({ appId, channel, token }: UseAgoraVoiceProps) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    console.log('🔧 [AGORA INIT] Initializing Agora client...');
    console.log('🔧 [AGORA INIT] App ID provided:', appId ? `${appId.substring(0, 8)}...` : 'MISSING');
    console.log('🔧 [AGORA INIT] Channel:', channel);

    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('⚠️ [AGORA INIT] Running on server side, skipping...');
      return;
    }

    // Dynamically import Agora SDK
    const initAgoraClient = async () => {
      try {
        console.log('📦 [AGORA INIT] Loading Agora SDK...');
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        console.log('✅ [AGORA INIT] Agora SDK loaded successfully');

        // Initialize Agora client
        console.log('🔨 [AGORA INIT] Creating Agora client...');
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        console.log('✅ [AGORA INIT] Agora client created');

        setClient(agoraClient);
        clientRef.current = agoraClient;

        // Event handlers
        console.log('🎯 [AGORA INIT] Setting up event handlers...');

        agoraClient.on('user-published', async (user, mediaType) => {
          console.log('👤 [AGORA EVENT] User published:', user.uid, 'Media type:', mediaType);
          try {
            await agoraClient.subscribe(user, mediaType);
            console.log('✅ [AGORA EVENT] Subscribed to user:', user.uid);

            if (mediaType === 'audio') {
              user.audioTrack?.play();
              console.log('🔊 [AGORA EVENT] Playing audio from user:', user.uid);
            }
            setRemoteUsers((prevUsers) => [...prevUsers.filter(u => u.uid !== user.uid), user]);
          } catch (error) {
            console.error('❌ [AGORA EVENT] Failed to subscribe to user:', error);
          }
        });

        agoraClient.on('user-unpublished', (user) => {
          console.log('👤 [AGORA EVENT] User unpublished:', user.uid);
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        });

        agoraClient.on('user-left', (user) => {
          console.log('👋 [AGORA EVENT] User left:', user.uid);
          setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
        });

        agoraClient.on('connection-state-change', (curState, prevState) => {
          console.log('🔗 [AGORA CONNECTION] State changed:', prevState, '→', curState);
        });

        agoraClient.on('network-quality', (stats) => {
          console.log('📊 [AGORA NETWORK] Uplink quality:', stats.uplinkNetworkQuality, 'Downlink:', stats.downlinkNetworkQuality);
        });

        console.log('✅ [AGORA INIT] All event handlers set up successfully');
      } catch (error) {
        console.error('❌ [AGORA INIT] Failed to initialize:', error);
      }
    };

    initAgoraClient();

    return () => {
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
      }
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') {
        clientRef.current.leave();
      }
    };
  }, []);

  const joinChannel = async () => {
    console.log('🎤 [VOICE] Starting to join voice channel...');
    console.log('🎤 [VOICE] Client exists:', !!client);
    console.log('🎤 [VOICE] App ID:', appId ? 'present' : 'MISSING');
    console.log('🎤 [VOICE] Channel:', channel);

    if (!client) {
      console.error('❌ [VOICE] No client available!');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🎤 [VOICE] Loading started...');

      // Fetch token from server
      let agoraToken = token;

      if (!agoraToken) {
        console.log('🔑 [VOICE] No token provided, fetching from server...');
        console.log('🔑 [VOICE] Request URL:', `/api/agora/token?channel=${channel}`);

        try {
          const response = await fetch(`/api/agora/token?channel=${encodeURIComponent(channel)}`);
          console.log('🔑 [VOICE] Token response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ [VOICE] Token fetch failed:', errorData);
            throw new Error(`Failed to fetch token: ${errorData.error || response.statusText}`);
          }

          const data = await response.json();
          console.log('✅ [VOICE] Token received from server');
          console.log('🔑 [VOICE] Token expireAt:', data.expireAt);

          agoraToken = data.token;
        } catch (fetchError: any) {
          console.error('❌ [VOICE] Token fetch error:', fetchError.message);
          throw new Error(`Failed to get Agora token: ${fetchError.message}`);
        }
      } else {
        console.log('🔑 [VOICE] Using provided token');
      }

      // Join the channel
      console.log('🔗 [VOICE] Joining Agora channel with token...');
      await client.join(appId, channel, agoraToken, null);
      console.log('✅ [VOICE] Successfully joined Agora channel!');

      // Dynamically import Agora SDK for audio track creation
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      // Create and publish local audio track
      console.log('🎙️ [VOICE] Requesting microphone access...');
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('✅ [VOICE] Microphone access granted!');

      setLocalAudioTrack(audioTrack);

      console.log('📡 [VOICE] Publishing audio track...');
      await client.publish([audioTrack]);
      console.log('✅ [VOICE] Audio track published successfully!');

      setIsJoined(true);
      console.log('🎉 [VOICE] Voice chat joined successfully!');
    } catch (error: any) {
      console.log('\n❌❌❌ [VOICE ERROR] ❌❌❌');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌\n');
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🎤 [VOICE] Loading finished');
    }
  };

  const leaveChannel = async () => {
    if (!client) return;

    try {
      setIsLoading(true);

      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      await client.leave();
      setIsJoined(false);
      setRemoteUsers([]);
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = async () => {
    if (!localAudioTrack) return;

    try {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      throw error;
    }
  };

  return {
    client,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isMuted,
    isLoading,
    joinChannel,
    leaveChannel,
    toggleMute,
  };
};
