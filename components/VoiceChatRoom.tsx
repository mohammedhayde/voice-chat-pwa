'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgoraVoice } from '@/hooks/useAgoraVoice';
import { usePusherChat } from '@/hooks/usePusherChat';
import HeaderBar from './chat/HeaderBar';
import VoiceControls from './chat/VoiceControls';
import ChatSection from './chat/ChatSection';
import ParticipantsSidebar from './chat/ParticipantsSidebar';

interface VoiceChatRoomProps {
  agoraAppId: string;
  agoraToken?: string;
  pusherAppKey: string;
  pusherCluster: string;
  channelName: string;
  userName: string;
}

export default function VoiceChatRoom({
  agoraAppId,
  agoraToken,
  pusherAppKey,
  pusherCluster,
  channelName,
  userName
}: VoiceChatRoomProps) {
  const {
    remoteUsers,
    isJoined,
    isMuted,
    isLoading,
    joinChannel,
    leaveChannel,
    toggleMute,
  } = useAgoraVoice({ appId: agoraAppId, channel: channelName, token: agoraToken });

  const {
    messages,
    isConnected: isChatConnected,
    connectedUsers,
    sendMessage,
  } = usePusherChat({
    appKey: pusherAppKey,
    cluster: pusherCluster,
    channelName,
    userName
  });

  const [error, setError] = useState<string>('');
  const [messageText, setMessageText] = useState('');

  const handleJoin = async () => {
    try {
      setError('');
      await joinChannel();
    } catch (err: any) {
      console.error('Agora error:', err);
      if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.message?.includes('dynamic use static key')) {
        setError('⚠️ يتطلب Token صالح للاختبار');
      } else if (err.code === 'INVALID_PARAMS') {
        setError('App ID غير صحيح');
      } else if (err.code === 'DEVICE_NOT_FOUND' || err.message?.includes('device not found')) {
        setError('🎤 لم يتم العثور على ميكروفون');
      } else if (err.code === 'PERMISSION_DENIED' || err.message?.includes('Permission denied')) {
        setError('🚫 تم رفض إذن الوصول للميكروفون');
      } else {
        setError(`فشل الانضمام: ${err.message || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleLeave = async () => {
    try {
      setError('');
      await leaveChannel();
    } catch (err) {
      setError('فشل مغادرة الغرفة');
      console.error(err);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
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
          userName={userName}
          isJoined={isJoined}
          participantsCount={remoteUsers.length + 1}
        />

        {/* Error Message */}
        {error && (
          <div className="mx-4 md:mx-6 mt-4">
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-center backdrop-blur-xl animate-shake max-w-3xl mx-auto">
              {error}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col-reverse lg:flex-row-reverse gap-0 min-h-0 max-w-[2000px] mx-auto w-full">
          {/* Main Content: Voice Controls + Chat */}
          <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 py-4">
            {/* Voice Controls */}
            <VoiceControls
              isJoined={isJoined}
              isMuted={isMuted}
              isLoading={isLoading}
              onJoin={handleJoin}
              onToggleMute={handleToggleMute}
              onLeave={handleLeave}
            />

            {/* Chat Section */}
            <ChatSection
              messages={messages}
              connectedUsers={connectedUsers}
              isChatConnected={isChatConnected}
              messageText={messageText}
              onMessageChange={setMessageText}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Right Sidebar: Participants */}
          {isJoined && (
            <ParticipantsSidebar
              userName={userName}
              isMuted={isMuted}
              remoteUsers={remoteUsers}
            />
          )}
        </div>
      </div>

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
