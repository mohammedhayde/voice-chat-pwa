'use client';

import { useState } from 'react';
import VoiceChatRoom from '@/components/VoiceChatRoom';

export default function Home() {
  const [appId, setAppId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [token, setToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
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

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (appId && channelName) {
      setIsConfigured(true);
    }
  };

  if (isConfigured) {
    return <VoiceChatRoom appId={appId} channelName={channelName} token={token} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎙️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            دردشة صوتية جماعية
          </h1>
          <p className="text-gray-600">
            تطبيق PWA للدردشة الصوتية باستخدام Agora
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label htmlFor="appId" className="block text-sm font-semibold text-gray-700 mb-2">
              Agora App ID *
            </label>
            <input
              id="appId"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="أدخل App ID من Agora"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              احصل عليه من{' '}
              <a
                href="https://console.agora.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Agora Console
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="channel" className="block text-sm font-semibold text-gray-700 mb-2">
              اسم القناة *
            </label>
            <input
              id="channel"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="مثال: voice-room-1"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              يمكن للمستخدمين الذين يستخدمون نفس اسم القناة التحدث معاً
            </p>
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">
              Token (اختياري)
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="اتركه فارغاً للاختبار"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              مطلوب للإنتاج، اختياري للاختبار
            </p>
          </div>

          {/* Microphone Test */}
          <div>
            <button
              type="button"
              onClick={testMicrophone}
              disabled={micStatus === 'checking'}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                micStatus === 'available'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : micStatus === 'unavailable'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {micStatus === 'checking' && '🔄 جاري اختبار الميكروفون...'}
              {micStatus === 'available' && '✅ الميكروفون يعمل بشكل صحيح'}
              {micStatus === 'unavailable' && '❌ الميكروفون غير متاح'}
              {micStatus === 'unchecked' && '🎤 اختبر الميكروفون قبل البدء'}
            </button>
            {micError && (
              <p className="text-sm text-red-600 mt-2">{micError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={micStatus === 'unavailable'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 ابدأ الدردشة
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <span className="ml-2">ℹ️</span>
            كيفية الاستخدام:
          </h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>سجل حساب مجاني في <a href="https://console.agora.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Agora Console</a></li>
            <li>أنشئ مشروع جديد واحصل على App ID</li>
            <li><strong>مهم للاختبار:</strong> عطّل &quot;Enable Primary Certificate&quot; في إعدادات المشروع</li>
            <li>أدخل App ID واسم القناة هنا</li>
            <li>شارك اسم القناة مع أصدقائك</li>
            <li>استمتع بالدردشة الصوتية!</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
            <span className="ml-2">⚠️</span>
            إذا ظهر خطأ &quot;Token required&quot;:
          </h3>
          <p className="text-xs text-gray-700">
            اذهب إلى <strong>Agora Console → Project Management → Config</strong>
            ثم عطّل <strong>&quot;Enable Primary Certificate&quot;</strong> للاختبار بدون token.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              يمكنك تثبيت هذا التطبيق على جهازك كـ PWA
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              💡 <strong>متطلبات:</strong> يجب استخدام متصفح حديث (Chrome, Edge, Safari) مع HTTPS أو localhost للوصول للميكروفون
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
