'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgoraVoice } from '@/hooks/useAgoraVoice';
import { useAgoraRTM } from '@/hooks/useAgoraRTM';

interface VoiceChatRoomProps {
  appId: string;
  channelName: string;
  token?: string;
  userName: string;
}

export default function VoiceChatRoom({ appId, channelName, token, userName }: VoiceChatRoomProps) {
  const {
    remoteUsers,
    isJoined,
    isMuted,
    isLoading,
    joinChannel,
    leaveChannel,
    toggleMute,
  } = useAgoraVoice({ appId, channel: channelName, token });

  const {
    messages,
    isConnected: isChatConnected,
    sendMessage,
  } = useAgoraRTM({ appId, channel: channelName, userName, token });

  const [error, setError] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = async () => {
    try {
      setError('');
      await joinChannel();
    } catch (err: any) {
      console.error('Agora error:', err);

      // Check for specific error codes
      if (err.code === 'CAN_NOT_GET_GATEWAY_SERVER' || err.message?.includes('dynamic use static key')) {
        setError('⚠️ مشروع Agora يتطلب Token. يرجى تعطيل "Enable Primary Certificate" في Agora Console للاختبار، أو أدخل Token صالح.');
      } else if (err.code === 'INVALID_PARAMS') {
        setError('App ID غير صحيح. تأكد من نسخه بشكل صحيح من Agora Console.');
      } else if (err.code === 'DEVICE_NOT_FOUND' || err.message?.includes('device not found')) {
        setError('🎤 لم يتم العثور على ميكروفون. تأكد من: 1) وجود ميكروفون متصل بجهازك 2) منح إذن الوصول للميكروفون 3) عدم استخدام الميكروفون من تطبيق آخر');
      } else if (err.code === 'PERMISSION_DENIED' || err.message?.includes('Permission denied')) {
        setError('🚫 تم رفض إذن الوصول للميكروفون. يرجى السماح للمتصفح بالوصول للميكروفون من إعدادات المتصفح.');
      } else {
        setError(`فشل الانضمام إلى الغرفة: ${err.message || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleLeave = async () => {
    try {
      setError('');
      await leaveChannel();
    } catch (err) {
      setError('فشل مغادرة الغرفة.');
      console.error(err);
    }
  };

  const handleToggleMute = async () => {
    try {
      setError('');
      await toggleMute();
    } catch (err) {
      setError('فشل تبديل كتم الصوت.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Voice Chat Section */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              دردشة صوتية جماعية
            </h1>
            <p className="text-gray-600">غرفة: {channelName}</p>
            <p className="text-sm text-gray-500 mt-1">مرحباً، {userName} 👋</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          {/* Status */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              isJoined ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-3 h-3 rounded-full ml-2 ${
                isJoined ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              {isJoined ? 'متصل' : 'غير متصل'}
            </div>
          </div>

          {/* Remote Users */}
          {isJoined && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                المشاركون ({remoteUsers.length + 1})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Local User */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white text-center">
                  <div className="text-4xl mb-2">🎤</div>
                  <p className="font-semibold">{userName}</p>
                  <p className="text-xs opacity-70">(أنت)</p>
                  <p className="text-sm opacity-80 mt-1">{isMuted ? 'مكتوم' : 'يتحدث'}</p>
                </div>

                {/* Remote Users */}
                {remoteUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white text-center"
                  >
                    <div className="text-4xl mb-2">👤</div>
                    <p className="font-semibold">مستخدم {user.uid}</p>
                    <p className="text-sm opacity-80">
                      {user.hasAudio ? '🔊 يتحدث' : '🔇 صامت'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isJoined ? (
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'جاري الانضمام...' : '🎙️ انضم إلى الغرفة'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleToggleMute}
                  disabled={isLoading}
                  className={`font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMuted
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`}
                >
                  {isMuted ? '🔇 إلغاء الكتم' : '🎤 كتم الصوت'}
                </button>

                <button
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'جاري المغادرة...' : '🚪 مغادرة الغرفة'}
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          {!isJoined && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-gray-700">
                💡 اضغط على &quot;انضم إلى الغرفة&quot; للبدء في الدردشة الصوتية
              </p>
              <p className="text-sm text-gray-600 mt-2">
                سيتم طلب إذن الوصول إلى الميكروفون
              </p>
            </div>
          )}
          </div>

          {/* Text Chat Section */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-2xl p-6 flex flex-col" style={{ height: '700px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">💬 الدردشة</h2>
              <div className={`w-3 h-3 rounded-full ${isChatConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 rounded-2xl p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <p className="text-4xl mb-2">💭</p>
                  <p className="text-sm">لا توجد رسائل بعد</p>
                  <p className="text-xs mt-1">ابدأ المحادثة!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isLocal ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.isLocal
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-1 ${message.isLocal ? 'text-blue-100' : 'text-blue-600'}`}>
                        {message.isLocal ? 'أنت' : message.userName}
                      </p>
                      <p className="text-sm break-words">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isLocal ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب رسالة..."
                disabled={!isChatConnected}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!isChatConnected || !messageText.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                📤
              </button>
            </form>

            {!isChatConnected && (
              <p className="text-xs text-center text-red-500 mt-2">
                ⚠️ الدردشة غير متصلة
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white">
          <p className="text-sm opacity-90">
            مدعوم بتقنية Agora • Progressive Web App
          </p>
        </div>
      </div>
    </div>
  );
}
