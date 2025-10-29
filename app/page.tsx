'use client';

import { useState } from 'react';
import VoiceChatRoom from '@/components/VoiceChatRoom';

// Define 10 fixed rooms
const ROOMS = [
  { id: 'room-1', name: 'غرفة العامة', emoji: '🌍', color: 'from-blue-500 to-blue-600', description: 'غرفة مفتوحة للجميع' },
  { id: 'room-2', name: 'غرفة الأصدقاء', emoji: '👥', color: 'from-purple-500 to-purple-600', description: 'للدردشة مع الأصدقاء' },
  { id: 'room-3', name: 'غرفة الألعاب', emoji: '🎮', color: 'from-green-500 to-green-600', description: 'للاعبين والمناقشات' },
  { id: 'room-4', name: 'غرفة الموسيقى', emoji: '🎵', color: 'from-pink-500 to-pink-600', description: 'لعشاق الموسيقى' },
  { id: 'room-5', name: 'غرفة التعليم', emoji: '📚', color: 'from-yellow-500 to-yellow-600', description: 'للدراسة والتعلم' },
  { id: 'room-6', name: 'غرفة الرياضة', emoji: '⚽', color: 'from-red-500 to-red-600', description: 'لمحبي الرياضة' },
  { id: 'room-7', name: 'غرفة التقنية', emoji: '💻', color: 'from-indigo-500 to-indigo-600', description: 'للتقنيين والمبرمجين' },
  { id: 'room-8', name: 'غرفة الأفلام', emoji: '🎬', color: 'from-orange-500 to-orange-600', description: 'لمحبي السينما' },
  { id: 'room-9', name: 'غرفة الطبخ', emoji: '🍳', color: 'from-teal-500 to-teal-600', description: 'لعشاق الطبخ' },
  { id: 'room-10', name: 'غرفة السفر', emoji: '✈️', color: 'from-cyan-500 to-cyan-600', description: 'لمحبي السفر والرحلات' },
];

export default function Home() {
  // Hardcoded Agora App ID
  const appId = 'ed407a71c9054d6197037f62849d2d87';
  const [userName, setUserName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [micStatus, setMicStatus] = useState<'unchecked' | 'checking' | 'available' | 'unavailable'>('unchecked');
  const [micError, setMicError] = useState('');

  const testMicrophone = async () => {
    setMicStatus('checking');
    setMicError('');

    // Check if browser supports mediaDevices
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unavailable');
      setMicError('متصفحك لا يدعم الوصول للميكروفون. استخدم Chrome أو Edge أو Safari الحديث، وتأكد من استخدام HTTPS أو localhost');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately after testing
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('available');
    } catch (err: any) {
      console.error('Microphone test failed:', err);
      setMicStatus('unavailable');

      if (err.name === 'NotFoundError') {
        setMicError('لم يتم العثور على ميكروفون متصل بجهازك');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('تم رفض إذن الوصول للميكروفون. يرجى السماح بالوصول من إعدادات المتصفح');
      } else if (err.name === 'NotReadableError') {
        setMicError('الميكروفون مستخدم من تطبيق آخر');
      } else {
        setMicError(`خطأ في الميكروفون: ${err.message}`);
      }
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    setShowNameInput(true);
  };

  const handleEnterRoom = () => {
    if (userName.trim() && selectedRoom) {
      setIsConfigured(true);
    }
  };

  if (isConfigured && selectedRoom && userName) {
    return <VoiceChatRoom appId={appId} channelName={selectedRoom} token={token} userName={userName} />;
  }

  // Show name input modal
  if (showNameInput && selectedRoom) {
    const room = ROOMS.find(r => r.id === selectedRoom);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${room?.color} flex items-center justify-center text-4xl mx-auto mb-4`}>
              {room?.emoji}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {room?.name}
            </h2>
            <p className="text-gray-600">
              {room?.description}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-2">
                ما اسمك؟ *
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="أدخل اسمك هنا"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition text-lg"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userName.trim()) {
                    handleEnterRoom();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                سيظهر اسمك للمشاركين الآخرين في الغرفة
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setSelectedRoom(null);
                  setUserName('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition"
              >
                رجوع
              </button>
              <button
                onClick={handleEnterRoom}
                disabled={!userName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                دخول 🚀
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              💡 تأكد من اختبار الميكروفون قبل الدخول
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎙️</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            غرف الدردشة الصوتية
          </h1>
          <p className="text-white/90 text-lg">
            اختر غرفة وابدأ الدردشة مع الأصدقاء
          </p>
        </div>

        {/* Microphone Test */}
        <div className="mb-6 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={testMicrophone}
            disabled={micStatus === 'checking'}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition shadow-lg ${
              micStatus === 'available'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : micStatus === 'unavailable'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            {micStatus === 'checking' && '🔄 جاري اختبار الميكروفون...'}
            {micStatus === 'available' && '✅ الميكروفون يعمل - اختر غرفة للدخول'}
            {micStatus === 'unavailable' && '❌ الميكروفون غير متاح - تحقق من الإعدادات'}
            {micStatus === 'unchecked' && '🎤 اختبر الميكروفون أولاً'}
          </button>
          {micError && (
            <p className="text-sm text-white bg-red-500/20 rounded-lg p-3 mt-2">{micError}</p>
          )}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              disabled={micStatus === 'unavailable'}
              className={`bg-white rounded-2xl p-6 shadow-xl transform transition hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-right`}
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${room.color} flex items-center justify-center text-3xl mb-4 mr-auto`}>
                {room.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {room.name}
              </h3>
              <p className="text-sm text-gray-600">
                {room.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  انقر للدخول
                </span>
                <span className="text-2xl">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <span className="ml-2">ℹ️</span>
            كيفية الاستخدام:
          </h3>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>اختبر الميكروفون للتأكد من أنه يعمل</li>
            <li>اختر غرفة من الغرف المتاحة</li>
            <li>شارك اسم الغرفة مع أصدقائك للانضمام إليك</li>
            <li>استمتع بالدردشة الصوتية الجماعية!</li>
          </ol>
        </div>

        {/* PWA Info */}
        <div className="mt-4 max-w-2xl mx-auto text-center">
          <p className="text-sm text-white/80">
            💡 يمكنك تثبيت هذا التطبيق على جهازك كـ PWA
          </p>
        </div>
      </div>
    </div>
  );
}
