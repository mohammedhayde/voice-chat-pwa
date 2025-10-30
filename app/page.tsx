'use client';

import { useState } from 'react';
import VoiceChatRoom from '@/components/VoiceChatRoom';

// Define 10 fixed rooms with enhanced design
const ROOMS = [
  { id: 'room-1', name: 'غرفة العامة', emoji: '🌍', color: 'from-blue-500 via-blue-600 to-indigo-600', description: 'مساحة مفتوحة للجميع', iconBg: 'bg-blue-100', textColor: 'text-blue-600' },
  { id: 'room-2', name: 'غرفة الأصدقاء', emoji: '👥', color: 'from-purple-500 via-purple-600 to-pink-600', description: 'للدردشة مع الأصدقاء', iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
  { id: 'room-3', name: 'غرفة الألعاب', emoji: '🎮', color: 'from-green-500 via-green-600 to-emerald-600', description: 'للاعبين والمناقشات', iconBg: 'bg-green-100', textColor: 'text-green-600' },
  { id: 'room-4', name: 'غرفة الموسيقى', emoji: '🎵', color: 'from-pink-500 via-pink-600 to-rose-600', description: 'لعشاق الموسيقى', iconBg: 'bg-pink-100', textColor: 'text-pink-600' },
  { id: 'room-5', name: 'غرفة التعليم', emoji: '📚', color: 'from-yellow-500 via-amber-600 to-orange-600', description: 'للدراسة والتعلم', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
  { id: 'room-6', name: 'غرفة الرياضة', emoji: '⚽', color: 'from-red-500 via-red-600 to-rose-600', description: 'لمحبي الرياضة', iconBg: 'bg-red-100', textColor: 'text-red-600' },
  { id: 'room-7', name: 'غرفة التقنية', emoji: '💻', color: 'from-indigo-500 via-indigo-600 to-blue-600', description: 'للتقنيين والمبرمجين', iconBg: 'bg-indigo-100', textColor: 'text-indigo-600' },
  { id: 'room-8', name: 'غرفة الأفلام', emoji: '🎬', color: 'from-orange-500 via-orange-600 to-red-600', description: 'لمحبي السينما', iconBg: 'bg-orange-100', textColor: 'text-orange-600' },
  { id: 'room-9', name: 'غرفة الطبخ', emoji: '🍳', color: 'from-teal-500 via-teal-600 to-cyan-600', description: 'لعشاق الطبخ', iconBg: 'bg-teal-100', textColor: 'text-teal-600' },
  { id: 'room-10', name: 'غرفة السفر', emoji: '✈️', color: 'from-cyan-500 via-sky-600 to-blue-600', description: 'لمحبي السفر والرحلات', iconBg: 'bg-cyan-100', textColor: 'text-cyan-600' },
];

export default function Home() {
  // Agora Configuration (for voice) - من .env.local
  const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const AGORA_TOKEN = process.env.NEXT_PUBLIC_AGORA_TOKEN || '';

  // Pusher Configuration (for text chat) - من .env.local
  const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
  const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

  const [userName, setUserName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [micStatus, setMicStatus] = useState<'unchecked' | 'checking' | 'available' | 'unavailable'>('unchecked');
  const [micError, setMicError] = useState('');

  const testMicrophone = async () => {
    setMicStatus('checking');
    setMicError('');

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unavailable');
      setMicError('متصفحك لا يدعم الوصول للميكروفون');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('available');
    } catch (err: any) {
      setMicStatus('unavailable');
      if (err.name === 'NotFoundError') {
        setMicError('لم يتم العثور على ميكروفون');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('تم رفض إذن الوصول للميكروفون');
      } else if (err.name === 'NotReadableError') {
        setMicError('الميكروفون مستخدم من تطبيق آخر');
      } else {
        setMicError('خطأ في الميكروفون');
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
    return (
      <VoiceChatRoom
        agoraAppId={AGORA_APP_ID}
        agoraToken={AGORA_TOKEN}
        pusherAppKey={PUSHER_APP_KEY}
        pusherCluster={PUSHER_CLUSTER}
        channelName={selectedRoom}
        userName={userName}
      />
    );
  }

  // Name input modal
  if (showNameInput && selectedRoom) {
    const room = ROOMS.find(r => r.id === selectedRoom);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${room?.color} flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl transform hover:scale-110 transition-transform duration-300`}>
              {room?.emoji}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {room?.name}
            </h2>
            <p className="text-gray-600">
              {room?.description}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="userName" className="block text-sm font-bold text-gray-700 mb-2">
                ما اسمك؟ *
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="أدخل اسمك هنا..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg font-medium outline-none"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userName.trim()) {
                    handleEnterRoom();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>🔒</span> سيظهر اسمك للمشاركين الآخرين
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setSelectedRoom(null);
                  setUserName('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105"
              >
                رجوع
              </button>
              <button
                onClick={handleEnterRoom}
                disabled={!userName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                دخول 🚀
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-700 text-center font-medium">
              💡 تأكد من اختبار الميكروفون قبل الدخول
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-8 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-7xl mb-4 animate-bounce-slow">🎙️</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            غرف الدردشة الصوتية
          </h1>
          <p className="text-white/80 text-xl md:text-2xl font-light">
            اختر غرفة وابدأ الدردشة مع الأصدقاء
          </p>
        </div>

        {/* Microphone Test Card */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                🎤
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">اختبار الميكروفون</h3>
                <p className="text-white/60 text-sm">تحقق من أن الميكروفون يعمل بشكل صحيح</p>
              </div>
            </div>

            <button
              type="button"
              onClick={testMicrophone}
              disabled={micStatus === 'checking'}
              className={`w-full py-4 px-6 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                micStatus === 'available'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : micStatus === 'unavailable'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              {micStatus === 'checking' && (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🔄</span> جاري الاختبار...
                </span>
              )}
              {micStatus === 'available' && '✅ الميكروفون يعمل - جاهز للانطلاق!'}
              {micStatus === 'unavailable' && '❌ الميكروفون غير متاح'}
              {micStatus === 'unchecked' && '🎤 اختبر الميكروفون الآن'}
            </button>

            {micError && (
              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-200">{micError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {ROOMS.map((room, index) => (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              disabled={micStatus === 'unavailable'}
              style={{ animationDelay: `${index * 50}ms` }}
              className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-right animate-fade-in-up"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${room.color} flex items-center justify-center text-3xl mb-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                {room.emoji}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                {room.name}
              </h3>

              <p className="text-sm text-white/70 mb-4">
                {room.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                  انقر للدخول
                </span>
                <span className="text-2xl transform group-hover:translate-x-1 transition-transform">
                  ←
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Features Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span>✨</span> المميزات
            </h3>
            <ul className="space-y-3">
              {[
                'محادثة صوتية فورية عبر Agora',
                'دردشة نصية في الوقت الفعلي عبر Pusher',
                'قائمة المستخدمين المتصلين',
                '10 غرف متنوعة للاختيار',
              ].map((feature, i) => (
                <li key={i} className="text-white/80 flex items-start gap-2">
                  <span className="text-green-400 mt-1">●</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to use Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span>📱</span> كيفية الاستخدام
            </h3>
            <ol className="space-y-3">
              {[
                'اختبر الميكروفون',
                'اختر غرفة',
                'أدخل اسمك',
                'ابدأ الدردشة!',
              ].map((step, i) => (
                <li key={i} className="text-white/80 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
            <span className="text-white/60 text-sm">مدعوم بـ</span>
            <span className="text-white font-semibold text-sm">Agora</span>
            <span className="text-white/40">•</span>
            <span className="text-white font-semibold text-sm">Pusher</span>
            <span className="text-white/40">•</span>
            <span className="text-white font-semibold text-sm">Next.js</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
