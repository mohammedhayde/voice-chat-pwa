'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const errorParam = searchParams.get('error');

        console.log('🔐 [CALLBACK] Processing auth callback...');
        console.log('🔐 [CALLBACK] Token present:', !!token);
        console.log('🔐 [CALLBACK] Refresh token present:', !!refreshToken);

        if (errorParam) {
          console.error('❌ [CALLBACK] Error from backend:', errorParam);
          setError('فشل تسجيل الدخول: ' + errorParam);
          setIsProcessing(false);
          return;
        }

        if (!token) {
          console.error('❌ [CALLBACK] No token received');
          setError('لم يتم استلام رمز المصادقة');
          setIsProcessing(false);
          return;
        }

        // Save tokens to localStorage
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        console.log('✅ [CALLBACK] Tokens saved to localStorage');

        // Fetch user data using the token
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-chatroom-api.fly.dev/api/auth';
          const response = await fetch(`${apiUrl}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ [CALLBACK] User data received:', userData);

            // Save user data to localStorage
            localStorage.setItem('user', JSON.stringify({
              userId: userData.id || userData.userId,
              username: userData.username,
              email: userData.email,
              isGuest: false
            }));

            // Refresh auth context
            refreshUser();

            console.log('🎉 [CALLBACK] Login successful, redirecting...');

            // Redirect to home page
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          } else {
            console.error('❌ [CALLBACK] Failed to fetch user data');
            // Still redirect even if user fetch fails, token is valid
            refreshUser();
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
        } catch (userError) {
          console.error('❌ [CALLBACK] Error fetching user:', userError);
          // Still redirect even if error, token is saved
          refreshUser();
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        }

      } catch (err) {
        console.error('❌ [CALLBACK] Error processing callback:', err);
        setError('حدث خطأ أثناء تسجيل الدخول');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, refreshUser, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="text-6xl mb-4 animate-bounce">🔐</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                جاري تسجيل الدخول...
              </h1>
              <p className="text-gray-600">الرجاء الانتظار</p>
              <div className="mt-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            </>
          ) : error ? (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                فشل تسجيل الدخول
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105"
              >
                العودة لتسجيل الدخول
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              جاري تسجيل الدخول...
            </h1>
            <p className="text-gray-600">الرجاء الانتظار</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
