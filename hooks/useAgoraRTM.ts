import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  userName: string;
  timestamp: number;
  isLocal: boolean;
}

export interface UseAgoraRTMProps {
  appId: string;
  channel: string;
  userName: string;
  token?: string;
}

export const useAgoraRTM = ({ appId, channel, userName, token }: UseAgoraRTMProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const initRTM = async () => {
      try {
        const AgoraRTM = (await import('agora-rtm-sdk')).default;

        // Create RTM client
        const client = AgoraRTM.createInstance(appId);
        clientRef.current = client;

        // Set up event listeners
        client.on('ConnectionStateChanged', (newState: string, reason: string) => {
          console.log('RTM Connection state changed:', newState, reason);
          setIsConnected(newState === 'CONNECTED');
        });

        // Login to RTM
        const uid = `${userName}_${Date.now()}`;
        await client.login({ uid, token: token || null });

        // Join channel
        const rtmChannel = client.createChannel(channel);
        channelRef.current = rtmChannel;

        // Listen for messages
        rtmChannel.on('ChannelMessage', ({ text }: { text: string }, senderId: string) => {
          try {
            const messageData = JSON.parse(text);
            const newMessage: ChatMessage = {
              id: Date.now().toString() + Math.random(),
              text: messageData.text,
              userName: messageData.userName,
              timestamp: messageData.timestamp,
              isLocal: false,
            };
            setMessages((prev) => [...prev, newMessage]);
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        });

        rtmChannel.on('MemberJoined', (memberId: string) => {
          console.log('Member joined:', memberId);
        });

        rtmChannel.on('MemberLeft', (memberId: string) => {
          console.log('Member left:', memberId);
        });

        // Join the channel
        await rtmChannel.join();
        setIsConnected(true);
      } catch (err) {
        console.error('RTM initialization error:', err);
        setIsConnected(false);
      }
    };

    initRTM();

    // Cleanup
    return () => {
      const cleanup = async () => {
        try {
          if (channelRef.current) {
            await channelRef.current.leave();
          }
          if (clientRef.current) {
            await clientRef.current.logout();
          }
        } catch (err) {
          console.error('RTM cleanup error:', err);
        }
      };
      cleanup();
    };
  }, [appId, channel, userName, token]);

  const sendMessage = useCallback(async (text: string) => {
    if (!channelRef.current || !text.trim()) return;

    try {
      setIsLoading(true);

      const messageData = {
        text: text.trim(),
        userName,
        timestamp: Date.now(),
      };

      // Send to channel
      await channelRef.current.sendMessage({ text: JSON.stringify(messageData) });

      // Add to local messages
      const newMessage: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        text: messageData.text,
        userName: messageData.userName,
        timestamp: messageData.timestamp,
        isLocal: true,
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error('Send message error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userName]);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
  };
};
