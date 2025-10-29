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
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Dynamically import Agora SDK
    const initAgoraClient = async () => {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      // Initialize Agora client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);
      clientRef.current = agoraClient;

    // Event handlers
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        setRemoteUsers((prevUsers) => [...prevUsers.filter(u => u.uid !== user.uid), user]);
      });

      agoraClient.on('user-unpublished', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      });

      agoraClient.on('user-left', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      });
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
    if (!client) return;

    try {
      setIsLoading(true);

      // Join the channel
      await client.join(appId, channel, token || null, null);

      // Dynamically import Agora SDK for audio track creation
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await client.publish([audioTrack]);

      setIsJoined(true);
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
