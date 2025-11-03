'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 [PWA] App is already installed');
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      console.log('📱 [PWA] User previously dismissed install prompt');
      return;
    }

    // Detect iOS/Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOSDevice || isSafari) {
      console.log('📱 [PWA] iOS/Safari detected - showing manual instructions');
      setIsIOS(true);
      setShowIOSInstructions(true);
      return;
    }

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('📱 [PWA] beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ [PWA] App successfully installed');
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('❌ [PWA] No deferred prompt available');
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`📱 [PWA] User response: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('✅ [PWA] User accepted the install prompt');
      } else {
        console.log('❌ [PWA] User dismissed the install prompt');
      }

      // Clear the prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ [PWA] Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    console.log('📱 [PWA] User dismissed install button');
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsInstallable(false);
    setShowIOSInstructions(false);
  };

  // iOS Instructions Component
  if (showIOSInstructions && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-5 border border-white/20 backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
            aria-label="إغلاق"
          >
            ✕
          </button>

          <div className="flex items-start gap-4 mb-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl shadow-lg">
              📱
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg mb-1">
                ثبّت التطبيق على iPhone
              </h3>
              <p className="text-white/80 text-sm">
                اتبع الخطوات التالية لتثبيت التطبيق على شاشتك الرئيسية
              </p>
            </div>
          </div>

          {/* Instructions Steps */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  اضغط على زر <span className="font-bold">المشاركة</span>
                  <span className="inline-block mx-1 text-2xl align-middle">⎋</span>
                  في الأسفل
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  اختر <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span>
                  <span className="inline-block mx-1 text-lg align-middle">➕</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  اضغط <span className="font-bold">"إضافة"</span> في الأعلى ✅
                </p>
              </div>
            </div>
          </div>

          {/* Features badges */}
          <div className="pt-4 border-t border-white/20">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: '⚡', text: 'فتح سريع' },
                { icon: '🔔', text: 'إشعارات' },
                { icon: '📴', text: 'بدون نت' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs text-white/90"
                >
                  <span>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 rounded-xl transition-all"
          >
            فهمت، شكراً!
          </button>
        </div>

        <style jsx>{`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(100px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-5 border border-white/20 backdrop-blur-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          aria-label="إغلاق"
        >
          ✕
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl shadow-lg">
            📱
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1">
              ثبّت التطبيق
            </h3>
            <p className="text-white/80 text-sm mb-4">
              ثبت التطبيق للوصول السريع وتجربة أفضل بدون متصفح
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 bg-white text-purple-600 font-bold py-2.5 px-4 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {isInstalling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    جاري التثبيت...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>⬇️</span>
                    تثبيت الآن
                  </span>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-white/90 hover:text-white font-semibold text-sm transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>

        {/* Features badges */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { icon: '⚡', text: 'فتح سريع' },
              { icon: '🔔', text: 'إشعارات' },
              { icon: '📴', text: 'يعمل بدون نت' },
            ].map((feature, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs text-white/90"
              >
                <span>{feature.icon}</span>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
