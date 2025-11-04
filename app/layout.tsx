import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "غرف الدردشة الصوتية",
  description: "منصة تواصل صوتي جماعي لإنشاء غرف دردشة والتحدث مع الأصدقاء في الوقت الفعلي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "غرف الدردشة",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e1b4b',
                  color: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  backdropFilter: 'blur(12px)',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
