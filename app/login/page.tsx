'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, guestLogin } from '@/lib/authService';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.usernameOrEmail, formData.password);
      refreshUser(); // تحديث حالة المستخدم

      // انتظار قصير للتأكد من حفظ البيانات في localStorage
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تسجيل الدخول');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await guestLogin();
      refreshUser(); // تحديث حالة المستخدم

      // انتظار قصير للتأكد من حفظ البيانات في localStorage
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تسجيل الدخول كضيف');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎙️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تسجيل الدخول</h1>
          <p className="text-gray-600">مرحباً بك في غرف الدردشة الصوتية</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="usernameOrEmail" className="block text-sm font-bold text-gray-700 mb-2">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <input
              id="usernameOrEmail"
              type="text"
              value={formData.usernameOrEmail}
              onChange={(e) =>
                setFormData({ ...formData, usernameOrEmail: e.target.value })
              }
              placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="أدخل كلمة المرور"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🔄</span> جاري تسجيل الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm font-medium">أو</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Login Button */}
        <div className="mb-4">
          <GoogleSignInButton />
        </div>

        {/* Guest Login Button */}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'جاري التحميل...' : '🎭 دخول كضيف'}
        </button>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ليس لديك حساب؟{' '}
            <Link
              href="/register"
              className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
            >
              سجل الآن
            </Link>
          </p>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-700 text-center">
            💡 يمكنك الدخول كضيف لتجربة التطبيق بدون تسجيل
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
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
      `}</style>
    </div>
  );
}
