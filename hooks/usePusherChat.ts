import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';

export interface ChatMessage {
  id: string;
  text: string;
  userName: string;
  timestamp: number;
  isLocal: boolean;
}

export interface ConnectedUser {
  id: string;
  name: string;
}

export interface UsePusherChatProps {
  appKey: string;
  cluster: string;
  channelName: string;
  userName: string;
}

export const usePusherChat = ({ appKey, cluster, channelName, userName }: UsePusherChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const initPusher = async () => {
      try {
        console.log('Initializing Pusher with:', { appKey, cluster, channelName });

        // Create Pusher client with auth endpoint
        const pusher = new Pusher(appKey, {
          cluster,
          forceTLS: true,
          authEndpoint: '/api/pusher/auth',
          channelAuthorization: {
            endpoint: '/api/pusher/auth',
            transport: 'ajax',
            params: {
              user_name: userName,
            },
          },
        });

        pusherRef.current = pusher;

        // Connection state listeners
        pusher.connection.bind('connected', () => {
          console.log('Pusher connected');
          setIsConnected(true);
        });

        pusher.connection.bind('disconnected', () => {
          console.log('Pusher disconnected');
          setIsConnected(false);
        });

        pusher.connection.bind('error', (err: any) => {
          console.error('Pusher connection error:', err);
          setIsConnected(false);
        });

        // Subscribe to presence channel (allows client events + user tracking)
        const channel = pusher.subscribe(`presence-${channelName}`);
        channelRef.current = channel;

        // Presence channel events
        channel.bind('pusher:subscription_succeeded', (members: any) => {
          console.log('Successfully subscribed to channel:', channelName);
          console.log('Current members:', members);

          // Get all current members
          const users: ConnectedUser[] = [];
          members.each((member: any) => {
            users.push({
              id: member.id,
              name: member.info?.name || 'مستخدم',
            });
          });
          setConnectedUsers(users);
        });

        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('Subscription error:', error);
        });

        // Member added
        channel.bind('pusher:member_added', (member: any) => {
          console.log('Member added:', member);
          setConnectedUsers((prev) => [
            ...prev,
            {
              id: member.id,
              name: member.info?.name || 'مستخدم',
            },
          ]);
        });

        // Member removed
        channel.bind('pusher:member_removed', (member: any) => {
          console.log('Member removed:', member);
          setConnectedUsers((prev) => prev.filter((user) => user.id !== member.id));
        });

        // Listen for client chat messages
        channel.bind('client-chat-message', (data: any) => {
          console.log('Received message:', data);

          // Don't add our own messages twice
          if (data.userId === pusher.connection.socket_id) {
            return;
          }

          const newMessage: ChatMessage = {
            id: data.id || `${Date.now()}-${Math.random()}`,
            text: data.text,
            userName: data.userName,
            timestamp: data.timestamp,
            isLocal: false,
          };

          setMessages((prev) => [...prev, newMessage]);
        });

      } catch (err: any) {
        console.error('Pusher initialization error:', err);
        setIsConnected(false);
      }
    };

    initPusher();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [appKey, cluster, channelName]);

  const sendMessage = useCallback(async (text: string) => {
    if (!pusherRef.current || !text.trim() || !isConnected) {
      console.error('Cannot send message:', {
        hasPusher: !!pusherRef.current,
        hasText: !!text.trim(),
        isConnected
      });
      return;
    }

    try {
      setIsLoading(true);

      const messageData = {
        id: `${Date.now()}-${Math.random()}`,
        text: text.trim(),
        userName,
        timestamp: Date.now(),
        userId: pusherRef.current.connection.socket_id,
      };

      // Note: To send messages, you need a backend server
      // For now, we'll use Pusher Channels client events (requires enabling in Pusher dashboard)
      // Alternative: Create a simple API endpoint to trigger Pusher events

      // Add to local messages immediately
      const newMessage: ChatMessage = {
        id: messageData.id,
        text: messageData.text,
        userName: messageData.userName,
        timestamp: messageData.timestamp,
        isLocal: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Trigger client event (must be enabled in Pusher dashboard)
      if (channelRef.current) {
        channelRef.current.trigger('client-chat-message', messageData);
      }

      console.log('Message sent:', messageData);
    } catch (err) {
      console.error('Send message error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userName, isConnected]);

  return {
    messages,
    isConnected,
    isLoading,
    connectedUsers,
    sendMessage,
  };
};
