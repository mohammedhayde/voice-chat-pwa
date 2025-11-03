import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as signalR from '@microsoft/signalr';
import { useSound } from './useSound';

// Get API base URL from environment or default
// Remove /api from the end because SignalR hub is at root level
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '').replace('/api', '') || 'https://backend-chatroom-api.fly.dev');
const SIGNALR_HUB_URL = `${API_BASE_URL}/chatHub`;

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  userId: number;
  username: string;
  content: string;
  sentAt: string;
  isLocal?: boolean;
}

// Backend message format (what SignalR actually sends)
interface SignalRMessage {
  userId: number;
  username: string;
  message: string;
  sentAt: string;
}

export interface ConnectedUser {
  // Basic user info
  userId: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string; // 'User' | 'Admin' | 'SuperAdmin'

  // Room permissions
  isRoomAdmin: boolean;
  isRoomOwner: boolean;

  // Mute status
  isMuted: boolean;
  mutedUntil: string | null; // null = permanent mute, date = temporary
  muteReason: string | null;

  // Ban status (usually false for online users)
  isBanned: boolean;

  // Suspension status
  isSuspended: boolean;
  suspendedUntil: string | null;

  // Connection info
  lastSeenAt: string;
  isOnline: boolean;
  connectionCount: number; // How many devices/tabs connected
}

export interface UseSignalRProps {
  roomId: number;
  userId: number;
  userName: string;
  onBanned?: (reason: string) => void;
  onKicked?: (reason: string) => void;
  onMuted?: (reason: string, expiresAt: string | null) => void;
  onUnmuted?: () => void;
}

export const useSignalR = ({ roomId, userId, userName, onBanned, onKicked, onMuted, onUnmuted }: UseSignalRProps) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const hasAttemptedConnection = useRef(false);
  const messageIdCounter = useRef(0); // Counter for unique message IDs
  const { playSound } = useSound();

  // Initialize SignalR connection
  useEffect(() => {
    // Prevent multiple connection attempts (important for React StrictMode)
    if (hasAttemptedConnection.current || connectionRef.current) {
      console.log('⏭️ [SIGNALR] Connection already exists, skipping...');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      console.error('❌ [SIGNALR] No access token found');
      return;
    }

    hasAttemptedConnection.current = true;
    console.log('🔌 [SIGNALR] Initializing connection to:', SIGNALR_HUB_URL);

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => accessToken,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false,
      })
      // Enable automatic reconnection with custom retry delays
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry after 0s, 2s, 5s, 10s, 30s
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Connection state handlers
    newConnection.onreconnecting((error) => {
      console.warn('⚠️ [SIGNALR] Reconnecting...', error);
      setIsConnected(false);
      toast.loading('🔄 إعادة الاتصال بالخادم...', {
        id: 'signalr-reconnecting',
        duration: Infinity
      });
    });

    newConnection.onreconnected(async (connectionId) => {
      console.log('✅ [SIGNALR] Reconnected:', connectionId);
      setIsConnected(true);
      toast.success('✅ تم إعادة الاتصال بالخادم', { id: 'signalr-reconnecting' });

      // Rejoin the room after reconnection
      try {
        await newConnection.invoke('JoinRoom', roomId, userId);
        console.log('🔄 [SIGNALR] Rejoined room after reconnection');

        // Refresh online users list
        await newConnection.invoke('GetOnlineUsers', roomId);
        console.log('🔄 [SIGNALR] Refreshed online users after reconnection');
      } catch (error) {
        console.error('❌ [SIGNALR] Failed to rejoin room:', error);
        toast.error('⚠️ فشل الانضمام للغرفة بعد إعادة الاتصال');
      }
    });

    newConnection.onclose(async (error) => {
      console.log('❌ [SIGNALR] Connection closed', error);
      setIsConnected(false);

      // Dismiss any reconnecting toast
      toast.dismiss('signalr-reconnecting');

      // Show error toast
      toast.error('❌ انقطع الاتصال بالخادم', {
        id: 'signalr-closed',
        duration: 5000
      });

      // Try manual reconnection after a delay if automatic reconnect failed
      console.log('🔄 [SIGNALR] Attempting manual reconnection in 5 seconds...');
      setTimeout(async () => {
        if (newConnection.state === signalR.HubConnectionState.Disconnected) {
          try {
            console.log('🔄 [SIGNALR] Starting manual reconnection...');
            await newConnection.start();
            console.log('✅ [SIGNALR] Manual reconnection successful');
          } catch (reconnectError) {
            console.error('❌ [SIGNALR] Manual reconnection failed:', reconnectError);
          }
        }
      }, 5000);
    });

    // Event Handlers

    // ReceiveMessage - رسالة جديدة
    newConnection.on('ReceiveMessage', (rawMessage: SignalRMessage) => {
      console.log('📨 [SIGNALR] New message:', rawMessage);

      // Transform backend format to frontend ChatMessage format
      const message: ChatMessage = {
        id: ++messageIdCounter.current, // Generate unique incremental ID
        chatRoomId: roomId,
        userId: rawMessage.userId,
        username: rawMessage.username,
        content: rawMessage.message,
        sentAt: rawMessage.sentAt,
        isLocal: rawMessage.username === userName
      };

      setMessages((prev) => [...prev, message]);

      // Play sound for incoming messages (not for own messages)
      if (rawMessage.username !== userName) {
        playSound('message');
      }
    });

    // OnlineUsers - قائمة المستخدمين المتصلين
    newConnection.on('OnlineUsers', (users: ConnectedUser[]) => {
      console.log('👥 [SIGNALR] Online users:', users);
      setConnectedUsers(users);
    });

    // UserJoined - مستخدم انضم
    newConnection.on('UserJoined', (data: { UserId: number; Username: string; JoinedAt: string }) => {
      console.log(`👋 [SIGNALR] ${data.Username} (${data.UserId}) joined room`);
      toast.success(`👋 ${data.Username} انضم للغرفة`, { duration: 2000 });
      playSound('join');
      // Request updated online users list (we need roomId from context)
      newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
        console.warn('⚠️ [SIGNALR] GetOnlineUsers not available or failed:', err.message);
        // Backend might not have this method yet - gracefully handle
      });
    });

    // UserLeft - مستخدم غادر
    newConnection.on('UserLeft', (data: { UserId: number; Username: string; LeftAt: string }) => {
      console.log(`👋 [SIGNALR] ${data.Username} (${data.UserId}) left room`);
      toast(`👋 ${data.Username} غادر الغرفة`, { duration: 2000, icon: '👋' });
      playSound('leave');
      // Request updated online users list
      newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
        console.warn('⚠️ [SIGNALR] GetOnlineUsers not available or failed:', err.message);
        // Backend might not have this method yet - gracefully handle
      });
    });

    // UserOnline - مستخدم متصل (global status)
    newConnection.on('UserOnline', (userId: number) => {
      console.log(`✅ [SIGNALR] User ${userId} came online`);
      // Refresh online users list for current room
      newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
        console.warn('⚠️ [SIGNALR] GetOnlineUsers not available:', err.message);
      });
    });

    // UserOffline - مستخدم غير متصل (global status)
    newConnection.on('UserOffline', (userId: number) => {
      console.log(`📴 [SIGNALR] User ${userId} went offline`);
      // Remove from connected users list
      setConnectedUsers((prev) => prev.filter(u => u.userId !== userId));
    });

    // RoomBanned - أنت محظور
    newConnection.on('RoomBanned', (roomId: number, reason: string, isPermanent: boolean, expiresAt: string | null) => {
      console.log('🚫 [SIGNALR] You were banned from room:', reason);
      if (onBanned) {
        onBanned(reason);
      }
    });

    // YouWereMuted - أنت مكتوم
    newConnection.on('YouWereMuted', (roomId: number, reason: string, isPermanent: boolean, expiresAt: string | null) => {
      console.log('🔇 [SIGNALR] You were muted:', reason);
      if (onMuted) {
        onMuted(reason, expiresAt);
      }
    });

    // UserBanned - مستخدم تم حظره
    newConnection.on('UserBanned', (
      roomId: number,
      userId: number,
      username: string,
      bannedByUsername: string,
      reason: string,
      isPermanent: boolean,
      expiresAt: string | null
    ) => {
      console.log(`🚫 [SIGNALR] ${username} was banned by ${bannedByUsername}`);

      // Immediately remove banned user from list
      setConnectedUsers((prev) => prev.filter(u => u.userId !== userId));

      // Refresh online users list to ensure consistency
      newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after ban:', err.message);
      });
    });

    // UserMuted - مستخدم تم كتمه
    newConnection.on('UserMuted', (data: {
      RoomId: number;
      UserId: number;
      Username: string;
      MutedByUsername: string;
      Reason: string;
      IsPermanent: boolean;
      MutedUntil: string | null;
    }) => {
      console.log(`🔇 [SIGNALR] ${data.Username} was muted by ${data.MutedByUsername}`);
      console.log(`   Reason: ${data.Reason}, Until: ${data.MutedUntil || 'Permanent'}`);

      // Show toast notification
      toast(`🔇 ${data.Username} تم كتمه من قبل ${data.MutedByUsername}`, {
        duration: 3000,
        icon: '🔇'
      });

      // Refresh online users list to show mute status
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after mute:', err.message);
      });
    });

    // UserUnmuted - مستخدم تم رفع كتمه (NEW!)
    newConnection.on('UserUnmuted', (data: {
      RoomId: number;
      UserId: number;
      Username: string;
      UnmutedByUsername: string;
    }) => {
      console.log(`🔊 [SIGNALR] ${data.Username} was unmuted by ${data.UnmutedByUsername}`);

      // Show toast notification
      toast.success(`🔊 ${data.Username} تم رفع كتمه من قبل ${data.UnmutedByUsername}`);

      // Refresh online users list to remove mute status
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after unmute:', err.message);
      });
    });

    // YouWereUnmuted - أنت تم رفع كتمك (NEW!)
    newConnection.on('YouWereUnmuted', (data: { RoomId: number }) => {
      console.log(`🔊 [SIGNALR] You were unmuted in room ${data.RoomId}`);
      if (onUnmuted) {
        onUnmuted();
      }
    });

    // UserKicked - مستخدم تم طرده (NEW!)
    newConnection.on('UserKicked', (data: {
      RoomId: number;
      UserId: number;
      Username: string;
      KickedByUsername: string;
      Reason: string;
    }) => {
      console.log(`👋 [SIGNALR] ${data.Username} was kicked by ${data.KickedByUsername}`);
      console.log(`   Reason: ${data.Reason}`);

      // Show toast notification
      toast(`👋 ${data.Username} تم طرده من قبل ${data.KickedByUsername}`, {
        duration: 3000,
        icon: '⚠️'
      });

      // Refresh online users list to remove kicked user
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after kick:', err.message);
      });
    });

    // RoomKicked - أنت تم طردك من الغرفة (NEW!)
    newConnection.on('RoomKicked', (data: {
      RoomId: number;
      Reason: string;
    }) => {
      console.log(`👋 [SIGNALR] You were kicked from room ${data.RoomId}`);
      console.log(`   Reason: ${data.Reason}`);
      if (onKicked) {
        onKicked(data.Reason);
      }
    });

    // UserUnbanned - مستخدم تم رفع حظره (NEW!)
    newConnection.on('UserUnbanned', (data: {
      RoomId: number;
      UserId: number;
      Username: string;
      UnbannedByUsername: string;
    }) => {
      console.log(`✅ [SIGNALR] ${data.Username} was unbanned by ${data.UnbannedByUsername}`);

      // Show toast notification
      toast.success(`✅ ${data.Username} تم رفع حظره من قبل ${data.UnbannedByUsername}`);

      // Refresh online users list to show unban status
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after unban:', err.message);
      });
    });

    // RoomUnbanned - تم رفع حظرك من الغرفة (NEW!)
    newConnection.on('RoomUnbanned', (data: { RoomId: number }) => {
      console.log(`✅ [SIGNALR] You were unbanned from room ${data.RoomId}`);
    });

    // UpdateOnlineUsers - تحديث قائمة المتصلين (NEW! IMPORTANT!)
    newConnection.on('UpdateOnlineUsers', (data: { RoomId: number }) => {
      console.log(`🔄 [SIGNALR] Updating online users list for room ${data.RoomId}`);
      // Refresh the online users list
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh online users:', err.message);
      });
    });

    // RoomSettingsUpdated - تم تحديث إعدادات الغرفة (NEW!)
    newConnection.on('RoomSettingsUpdated', (settings: any) => {
      console.log('⚙️ [SIGNALR] Room settings updated:', settings);
      toast(`⚙️ تم تحديث إعدادات الغرفة`, {
        duration: 3000,
        icon: '⚙️'
      });
      // يمكن إضافة state management هنا لاحقاً
    });

    // UserBannedByIpHistory - تم حظر مستخدم بسجل IP (NEW!)
    newConnection.on('UserBannedByIpHistory', (data: {
      RoomId: number;
      UserId: number;
      Username: string;
      BannedIpAddresses: string[];
      TotalIpsBanned: number;
      BannedByUsername: string;
      Reason: string;
      IsPermanent: boolean;
      ExpiresAt: string | null;
    }) => {
      console.log(`🚫 [SIGNALR] ${data.Username} banned by IP history - ${data.TotalIpsBanned} IPs banned`);
      console.log(`   Banned IPs:`, data.BannedIpAddresses);
      console.log(`   Reason: ${data.Reason}`);

      // Show toast notification
      toast(`🚫 ${data.Username} تم حظره بـ ${data.TotalIpsBanned} عناوين IP`, {
        duration: 4000,
        icon: '🚫'
      });

      // Remove user from connected users list
      setConnectedUsers((prev) => prev.filter(u => u.userId !== data.UserId));

      // Refresh online users list
      newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
        console.warn('⚠️ [SIGNALR] Failed to refresh after IP ban:', err.message);
      });
    });

    // MessageDeleted - رسالة محذوفة
    newConnection.on('MessageDeleted', (messageId: number, roomId: number) => {
      console.log(`🗑️ [SIGNALR] Message ${messageId} was deleted`);
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    // Start connection
    newConnection.start()
      .then(() => {
        console.log('✅ [SIGNALR] Connected successfully');
        setIsConnected(true);
        setConnection(newConnection);
        connectionRef.current = newConnection;

        // Join the room with roomId and userId (as per backend requirements)
        return newConnection.invoke('JoinRoom', roomId, userId);
      })
      .then(() => {
        console.log(`✅ [SIGNALR] Joined room ${roomId} as user ${userId} (${userName})`);

        // Request list of online users after joining
        return newConnection.invoke('GetOnlineUsers', roomId)
          .then(() => {
            console.log('✅ [SIGNALR] Requested online users list');
          })
          .catch(err => {
            console.warn('⚠️ [SIGNALR] GetOnlineUsers not available:', err.message);
            // Backend might not have this method yet - continue anyway
          });
      })
      .catch((error) => {
        console.error('❌ [SIGNALR] Connection/Join failed:', error);
        // Stop automatic reconnection on join failure
        if (newConnection.state === signalR.HubConnectionState.Connected) {
          newConnection.stop();
        }
      });

    // Cleanup - only runs when component unmounts
    return () => {
      console.log('🧹 [SIGNALR] Cleanup triggered');

      // Don't reset flag or disconnect if this is just React StrictMode's double-invoke
      // Only cleanup when component actually unmounts
    };
  }, []); // Empty deps to run only once

  // Separate cleanup effect that runs on unmount only
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        const conn = connectionRef.current;
        console.log('👋 [SIGNALR] Component unmounting, disconnecting...');

        // Leave room before disconnecting
        if (conn.state === signalR.HubConnectionState.Connected) {
          conn.invoke('LeaveRoom', roomId, userId)
            .then(() => console.log('👋 [SIGNALR] Left room'))
            .catch(err => console.error('❌ [SIGNALR] Failed to leave room:', err))
            .finally(() => {
              conn.stop()
                .then(() => {
                  console.log('🔌 [SIGNALR] Disconnected');
                  hasAttemptedConnection.current = false;
                  connectionRef.current = null;
                })
                .catch(err => console.error('❌ [SIGNALR] Disconnect error:', err));
            });
        } else {
          conn.stop();
          hasAttemptedConnection.current = false;
          connectionRef.current = null;
        }
      }
    };
  }, [roomId, userId]); // Cleanup when roomId or userId changes or unmount

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to server');
    }

    if (!content.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      console.log('📤 [SIGNALR] Sending message:', content);
      await connection.invoke('SendMessage', roomId, userId, content);
      console.log('✅ [SIGNALR] Message sent');
    } catch (error: any) {
      console.error('❌ [SIGNALR] Failed to send message:', error);

      if (error.message?.includes('muted')) {
        throw new Error('You are muted and cannot send messages');
      } else if (error.message?.includes('banned')) {
        throw new Error('You are banned from this room');
      } else {
        throw new Error('Failed to send message');
      }
    }
  }, [connection, roomId, userId]);

  return {
    isConnected,
    messages,
    connectedUsers,
    sendMessage,
    connection,
  };
};
