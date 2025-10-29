'use client';

import { useState } from 'react';
import { useAgoraVoice } from '@/hooks/useAgoraVoice';

interface VoiceChatRoomProps {
  appId: string;
  channelName: string;
  token?: string;
}

export default function VoiceChatRoom({ appId, channelName, token }: VoiceChatRoomProps) {
  const {
    remoteUsers,
    isJoined,
    isMuted,
    isLoading,
    joinChannel,
    leaveChannel,
    toggleMute,
  } = useAgoraVoice({ appId, channel: channelName, token });

  const [error, setError] = useState<string>('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              دردشة صوتية جماعية
            </h1>
            <p className="text-gray-600">غرفة: {channelName}</p>
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
                  <p className="font-semibold">أنت</p>
                  <p className="text-sm opacity-80">{isMuted ? 'مكتوم' : 'يتحدث'}</p>
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
