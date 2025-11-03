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
  uid?: number; // Add UID parameter
}

export const useAgoraVoice = ({ appId, channel, token, uid }: UseAgoraVoiceProps) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false); // Deafen state (stop hearing others)
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Voice activity for local user
  const [speakingUsers, setSpeakingUsers] = useState<Set<number | string>>(new Set()); // Voice activity for remote users
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDeafenedRef = useRef<boolean>(false);

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
              // Only play if not deafened
              if (!isDeafenedRef.current) {
                user.audioTrack?.play();
                console.log('🔊 [AGORA EVENT] Playing audio from user:', user.uid);
              } else {
                console.log('🔇 [AGORA EVENT] Audio subscribed but not playing (deafened)');
              }
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
          setSpeakingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(user.uid);
            return newSet;
          });
        });

        // Volume indicator for detecting speaking users
        agoraClient.on('volume-indicator', (volumes) => {
          volumes.forEach((volume) => {
            const volumeLevel = volume.level;
            const userId = volume.uid;

            // Consider user speaking if volume is above threshold (e.g., 10)
            if (volumeLevel > 10) {
              setSpeakingUsers((prev) => new Set(prev).add(userId));
            } else {
              setSpeakingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
              });
            }
          });
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
      console.log('🧹 [AGORA CLEANUP] Cleaning up Agora resources...');

      // Clear volume interval
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
        console.log('✅ [AGORA CLEANUP] Volume interval cleared');
      }

      // Close local audio track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
        console.log('✅ [AGORA CLEANUP] Local audio track closed');
      }

      // Stop all remote audio tracks
      if (clientRef.current) {
        const remoteUsers = clientRef.current.remoteUsers;
        remoteUsers.forEach((user) => {
          if (user.audioTrack) {
            user.audioTrack.stop();
            console.log(`✅ [AGORA CLEANUP] Stopped audio from user: ${user.uid}`);
          }
        });
      }

      // Remove event listeners
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        console.log('✅ [AGORA CLEANUP] Event listeners removed');
      }

      // Leave channel if connected
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') {
        clientRef.current.leave().then(() => {
          console.log('✅ [AGORA CLEANUP] Left channel');
        }).catch((err) => {
          console.error('❌ [AGORA CLEANUP] Failed to leave channel:', err);
        });
      }

      console.log('🧹 [AGORA CLEANUP] Cleanup complete');
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
      console.log('🔗 [VOICE] Using UID:', uid || 'null (auto-assign)');
      await client.join(appId, channel, agoraToken, uid || null);
      console.log('✅ [VOICE] Successfully joined Agora channel!');

      // Dynamically import Agora SDK for audio track creation
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      // Create and publish local audio track
      console.log('🎙️ [VOICE] Requesting microphone access...');
      let audioTrack: IMicrophoneAudioTrack;
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('✅ [VOICE] Microphone access granted!');
      } catch (micError: any) {
        console.error('❌ [VOICE] Microphone access denied or failed:', micError);
        // Leave the channel immediately if mic access fails
        await client.leave();
        console.log('🚪 [VOICE] Left channel due to microphone error');
        throw micError;
      }

      setLocalAudioTrack(audioTrack);
      localAudioTrackRef.current = audioTrack; // Store in ref for cleanup

      console.log('📡 [VOICE] Publishing audio track...');
      await client.publish([audioTrack]);
      console.log('✅ [VOICE] Audio track published successfully!');

      // Enable volume indicator
      console.log('🔊 [VOICE] Enabling volume indicator...');
      client.enableAudioVolumeIndicator();

      // Setup local volume monitoring
      const volumeInterval = setInterval(() => {
        if (localAudioTrackRef.current) {
          const volumeLevel = localAudioTrackRef.current.getVolumeLevel();
          setIsSpeaking(volumeLevel > 0.1); // 10% threshold
        }
      }, 200); // Check every 200ms

      // Store interval ID in ref for cleanup
      volumeIntervalRef.current = volumeInterval;

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

      // Clear volume monitoring interval
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
        console.log('✅ [LEAVE] Volume interval cleared');
      }

      // Close local audio track
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
        setLocalAudioTrack(null);
        console.log('✅ [LEAVE] Local audio track closed');
      }

      // Stop all remote audio tracks
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          user.audioTrack.stop();
          console.log(`✅ [LEAVE] Stopped audio from user: ${user.uid}`);
        }
      });

      await client.leave();
      setIsJoined(false);
      setRemoteUsers([]);
      setSpeakingUsers(new Set());
      setIsSpeaking(false);
      console.log('✅ [LEAVE] Successfully left channel');
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;

    try {
      await localAudioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      throw error;
    }
  };

  const toggleDeafen = async () => {
    try {
      const newDeafenState = !isDeafened;
      console.log(`🔇 [DEAFEN] Toggling deafen: ${isDeafened} → ${newDeafenState}`);

      // Update ref immediately for event handlers
      isDeafenedRef.current = newDeafenState;
      setIsDeafened(newDeafenState);

      // Toggle audio playback for all remote users
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          if (newDeafenState) {
            user.audioTrack.stop();
            console.log(`🔇 [DEAFEN] Stopped audio from user: ${user.uid}`);
          } else {
            user.audioTrack.play();
            console.log(`🔊 [DEAFEN] Resumed audio from user: ${user.uid}`);
          }
        }
      });
    } catch (error) {
      console.error('Failed to toggle deafen:', error);
      throw error;
    }
  };

  return {
    client,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isMuted,
    isDeafened,
    isLoading,
    isSpeaking,
    speakingUsers,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
  };
};
