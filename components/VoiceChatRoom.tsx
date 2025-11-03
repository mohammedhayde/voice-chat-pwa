'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAgoraVoice } from '@/hooks/useAgoraVoice';
import { useSignalR } from '@/hooks/useSignalR';
import { joinChatRoom, leaveChatRoom, RoomPermissions } from '@/lib/chatRoomsService';
import HeaderBar from './chat/HeaderBar';
import VoiceControls from './chat/VoiceControls';
import ChatSection from './chat/ChatSection';
import ParticipantsSidebar from './chat/ParticipantsSidebar';
import RoomSettingsModal from './modals/RoomSettingsModal';
import RoomMembershipHistoryModal from './modals/RoomMembershipHistoryModal';
import BannedUsersModal from './modals/BannedUsersModal';

interface VoiceChatRoomProps {
  agoraAppId: string;
  agoraToken?: string;
  agoraUid?: number;
  channelName: string;
  roomName?: string;
  userName: string;
  userId?: number;
  roomId?: number;
  permissions?: RoomPermissions;
}

export default function VoiceChatRoom({
  agoraAppId,
  agoraToken,
  agoraUid,
  channelName,
  roomName,
  userName,
  userId,
  roomId,
  permissions
}: VoiceChatRoomProps) {
  const router = useRouter();
  const leaveChannelRef = useRef<(() => Promise<void>) | null>(null);
  const isJoinedRef = useRef<boolean>(false);

  const {
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
  } = useAgoraVoice({ appId: agoraAppId, channel: channelName, token: agoraToken, uid: agoraUid });

  // Update refs when values change
  useEffect(() => {
    leaveChannelRef.current = leaveChannel;
    isJoinedRef.current = isJoined;
  }, [leaveChannel, isJoined]);

  // Replace Pusher with SignalR
  const {
    messages,
    isConnected: isChatConnected,
    connectedUsers,
    sendMessage: sendSignalRMessage,
  } = useSignalR({
    roomId: roomId || 0,
    userId: userId || 0,
    userName,
    onBanned: async (reason) => {
      console.log('🚫 [BAN] onBanned callback triggered:', reason);
      toast.error(`🚫 تم حظرك من الغرفة - السبب: ${reason}`, { duration: 5000 });

      // Leave voice channel before redirecting
      if (isJoinedRef.current && leaveChannelRef.current) {
        try {
          await leaveChannelRef.current();
          console.log('✅ Left voice channel after ban');
        } catch (err) {
          console.error('❌ Failed to leave voice channel:', err);
        }
      }

      // Force redirect after delay
      console.log('🔄 Redirecting to home page in 2 seconds...');
      setTimeout(() => {
        console.log('🏠 Executing redirect now...');
        window.location.href = '/';
      }, 2000);
    },
    onKicked: async (reason) => {
      console.log('👋 [KICK] onKicked callback triggered:', reason);
      toast.error(`👋 تم طردك من الغرفة - السبب: ${reason}`, { duration: 5000 });

      // Leave voice channel before redirecting
      if (isJoinedRef.current && leaveChannelRef.current) {
        try {
          await leaveChannelRef.current();
          console.log('✅ Left voice channel after kick');
        } catch (err) {
          console.error('❌ Failed to leave voice channel:', err);
        }
      }

      // Force redirect after delay
      console.log('🔄 Redirecting to home page in 2 seconds...');
      setTimeout(() => {
        console.log('🏠 Executing redirect now...');
        window.location.href = '/';
      }, 2000);
    },
    onMuted: (reason, expiresAt) => {
      const until = expiresAt ? new Date(expiresAt).toLocaleString('ar-SA') : 'دائماً';
      toast.error(`🔇 تم كتمك من الغرفة - السبب: ${reason} - حتى: ${until}`, { duration: 5000 });
      setError(`🔇 تم كتمك من الغرفة - السبب: ${reason} - حتى: ${until}`);
    }
  });

  const [error, setError] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRoomMembershipHistoryOpen, setIsRoomMembershipHistoryOpen] = useState(false);
  const [isBannedUsersOpen, setIsBannedUsersOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Check if current user is muted by finding them in connectedUsers
  const currentUser = connectedUsers.find(u => u.userId === userId);
  const isUserMuted = currentUser?.isMuted || false;

  const handleJoin = async () => {
    try {
      setError('');
      setPermissionDenied(false);

      // Force microphone permission request by calling getUserMedia first
      // This ensures browser shows permission dialog even after previous denial
      console.log('🎤 [PERMISSION] Requesting microphone access explicitly...');
      let testStream: MediaStream | null = null;
      try {
        testStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('✅ [PERMISSION] Microphone permission granted');

        // Stop the test stream immediately, we'll create proper track via Agora
        testStream.getTracks().forEach(track => track.stop());
        testStream = null;
      } catch (permErr: any) {
        console.error('❌ [PERMISSION] Microphone access denied:', permErr);
        setPermissionDenied(true);

        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setError('🚫 تم رفض صلاحية الميكروفون - لتفعيلها:\n1️⃣ انقر على أيقونة القفل 🔒 بجانب عنوان الموقع\n2️⃣ اختر "السماح" أو "Allow" للميكروفون\n3️⃣ انقر "إعادة المحاولة" مرة أخرى');
        } else if (permErr.name === 'NotFoundError') {
          setError('🎤 لم يتم العثور على ميكروفون - تأكد من توصيل ميكروفون بجهازك');
        } else {
          setError(`❌ خطأ في الوصول للميكروفون: ${permErr.message}`);
        }

        toast.error('يرجى السماح بصلاحية الميكروفون من المتصفح', {
          duration: 8000,
          icon: '🎤',
        });
        return; // Don't proceed with join
      }

      await joinChannel();
    } catch (err: any) {
      console.error('Agora error:', err);
      if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.message?.includes('dynamic use static key')) {
        setError('⚠️ يتطلب Token صالح للاختبار');
      } else if (err.code === 'INVALID_PARAMS') {
        setError('App ID غير صحيح');
      } else if (err.code === 'DEVICE_NOT_FOUND' || err.message?.includes('device not found')) {
        setError('🎤 لم يتم العثور على ميكروفون - تأكد من توصيل ميكروفون بجهازك');
      } else if (err.code === 'PERMISSION_DENIED' || err.message?.includes('Permission denied') || err.name === 'NotAllowedError') {
        setPermissionDenied(true);

        // إخراج المستخدم من الغرفة
        if (isJoined) {
          try {
            await leaveChannel();
          } catch (leaveErr) {
            console.error('Failed to leave after permission denied:', leaveErr);
          }
        }

        setError('🚫 تم رفض إذن الميكروفون - لتفعيل الصلاحية:\n1️⃣ انقر على أيقونة القفل 🔒 بجانب رابط الموقع\n2️⃣ اختر "السماح" للميكروفون\n3️⃣ انقر على زر "إعادة المحاولة" أسفله');
        toast.error('يرجى تفعيل صلاحية الميكروفون من إعدادات المتصفح', {
          duration: 8000,
          icon: '🎤',
        });
      } else {
        setError(`فشل الانضمام: ${err.message || 'خطأ غير معروف'}`);
      }
    }
  };

  // Auto-join voice chat when SignalR connects
  useEffect(() => {
    if (isChatConnected && !isJoined && !isLoading && !permissionDenied) {
      console.log('🎤 [AUTO-JOIN] SignalR connected, auto-joining voice chat...');
      handleJoin();
    }
  }, [isChatConnected, isJoined, isLoading, permissionDenied]);

  const handleLeave = async () => {
    try {
      setError('');
      console.log('🚪 [LEAVE] Starting leave process...');

      // Leave voice channel first
      await leaveChannel();
      console.log('✅ [LEAVE] Left voice channel');

      // If roomId is provided, notify API about leaving
      if (roomId) {
        console.log('📤 [API] Notifying server about leaving room...');
        await leaveChatRoom(roomId);
        console.log('✅ [API] Successfully left room');
      }

      // Show success message
      toast.success('تم مغادرة الغرفة بنجاح');

      // Redirect to home page after a short delay
      console.log('🔄 Redirecting to home page...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      setError('فشل مغادرة الغرفة');
      console.error('❌ [LEAVE] Error:', err);
      toast.error('حدث خطأ أثناء المغادرة');
    }
  };

  const handleToggleMute = async () => {
    try {
      setError('');
      await toggleMute();
    } catch (err) {
      setError('فشل تبديل كتم الصوت');
      console.error(err);
    }
  };

  const handleToggleDeafen = async () => {
    try {
      setError('');
      await toggleDeafen();
    } catch (err) {
      setError('فشل تبديل الاستماع');
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendSignalRMessage(messageText);
      setMessageText('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'فشل في إرسال الرسالة');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header Bar */}
        <HeaderBar
          channelName={channelName}
          roomName={roomName}
          roomId={roomId}
          userName={userName}
          isJoined={isJoined}
          participantsCount={remoteUsers.length + 1}
          canModerate={permissions?.canModerate}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onMembershipHistoryClick={() => setIsRoomMembershipHistoryOpen(true)}
          onBannedUsersClick={() => setIsBannedUsersOpen(true)}
        />

        {/* Error Message */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4">
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-xl animate-shake max-w-3xl mx-auto">
              <div className="text-center whitespace-pre-line mb-3">
                {error}
              </div>
              {permissionDenied && (
                <div className="flex justify-center">
                  <button
                    onClick={handleJoin}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                  >
                    🔄 إعادة المحاولة
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-row-reverse gap-0 min-h-0 max-w-[2000px] mx-auto w-full relative">
          {/* Main Content: Voice Controls + Chat */}
          <div className="flex-1 flex flex-col min-h-0 px-3 md:px-6 py-3 md:py-4">
            {/* Mobile: Toggle Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden mb-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 text-white font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <span>👥</span>
                <span>المتصلون</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{connectedUsers.length}</span>
              </span>
              <span className="text-xl">{isSidebarOpen ? '✕' : '☰'}</span>
            </button>

            {/* Voice Controls */}
            <VoiceControls
              isJoined={isJoined}
              isMuted={isMuted}
              isDeafened={isDeafened}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              onJoin={handleJoin}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onLeave={handleLeave}
            />

            {/* Chat Section */}
            <ChatSection
              messages={messages}
              connectedUsers={connectedUsers}
              isChatConnected={isChatConnected}
              messageText={messageText}
              canSendMessages={!isUserMuted && (permissions?.canSendMessages !== false)}
              onMessageChange={setMessageText}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Sidebar Overlay (Mobile) / Fixed Sidebar (Desktop) */}
          <div className={`
            fixed lg:relative inset-y-0 right-0 z-50
            transform transition-transform duration-300 ease-in-out
            lg:transform-none
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            w-80 lg:w-80
          `}>
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Right Sidebar: Participants */}
            <ParticipantsSidebar
              userName={userName}
              isMuted={isMuted}
              isSpeaking={isSpeaking}
              speakingUsers={speakingUsers}
              isVoiceJoined={isJoined}
              remoteUsers={remoteUsers}
              connectedUsers={connectedUsers}
              roomId={roomId}
              permissions={permissions}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Room Settings Modal */}
      {roomId && (
        <RoomSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          roomId={roomId}
          isOwner={permissions?.isOwner || false}
          canModerate={permissions?.canModerate || false}
        />
      )}

      {/* Room Membership History Modal */}
      {roomId && (
        <RoomMembershipHistoryModal
          isOpen={isRoomMembershipHistoryOpen}
          onClose={() => setIsRoomMembershipHistoryOpen(false)}
          roomId={roomId}
          canModerate={permissions?.canModerate}
        />
      )}

      {/* Banned Users Modal */}
      {roomId && (
        <BannedUsersModal
          isOpen={isBannedUsersOpen}
          onClose={() => setIsBannedUsersOpen(false)}
          roomId={roomId}
          canModerate={permissions?.canModerate}
        />
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
