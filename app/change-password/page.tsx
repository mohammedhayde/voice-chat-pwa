'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { changePassword, validatePassword } from '@/lib/authService';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Redirect if not authenticated or is guest
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.isGuest === true) {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, newPassword: password });

    // Validate password
    const errors: string[] = [];
    if (password.length > 0 && password.length < 8) {
      errors.push('يجب أن تكون 8 أحرف على الأقل');
    }
    if (password.length > 0 && !/[A-Z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير');
    }
    if (password.length > 0 && !/[a-z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير');
    }
    if (password.length > 0 && !/[0-9]/.test(password)) {
      errors.push('يجب أن تحتوي على رقم');
    }

    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمتا المرور الجديدة غير متطابقتين');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'كلمة المرور الجديدة غير قوية');
      return;
    }

    // Check if new password is same as current
    if (formData.currentPassword === formData.newPassword) {
      setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
      return;
    }

    setLoading(true);

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">جاري التحميل...</div>
      </div>
    );
  }

  // Don't render if not authenticated or is guest
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if is guest
  if (user?.isGuest === true) {
    return null;
  }

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
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تغيير كلمة المرور</h1>
          <p className="text-gray-600">قم بتحديث كلمة المرور الخاصة بك</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm text-center font-medium">
              ✅ تم تغيير كلمة المرور بنجاح! سيتم تحويلك للصفحة الرئيسية...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-700 mb-2">
              كلمة المرور الحالية *
            </label>
            <input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              placeholder="أدخل كلمة المرور الحالية"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
              required
              disabled={loading || success}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">
              كلمة المرور الجديدة *
            </label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
              required
              disabled={loading || success}
              minLength={8}
            />
            {passwordErrors.length > 0 && formData.newPassword && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500 flex items-center gap-1">
                    <span>•</span> {err}
                  </p>
                ))}
              </div>
            )}
            {passwordErrors.length === 0 && formData.newPassword && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                ✓ كلمة المرور قوية
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
              تأكيد كلمة المرور الجديدة *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="أعد إدخال كلمة المرور الجديدة"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-lg outline-none"
              required
              disabled={loading || success}
            />
            {formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
              )}
            {formData.confirmPassword &&
              formData.newPassword === formData.confirmPassword && (
                <p className="text-xs text-green-600 mt-1">✓ متطابقة</p>
              )}
          </div>

          <button
            type="submit"
            disabled={loading || success || passwordErrors.length > 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🔄</span> جاري التغيير...
              </span>
            ) : success ? (
              '✅ تم التغيير بنجاح'
            ) : (
              'تغيير كلمة المرور'
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 font-bold hover:underline"
          >
            ← العودة للصفحة الرئيسية
          </Link>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-700 text-center">
            ⚠️ بعد تغيير كلمة المرور، سيتم تسجيل خروجك من جميع الأجهزة الأخرى
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
