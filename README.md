# 🎙️ Voice Chat PWA

تطبيق Progressive Web App للدردشة الصوتية الجماعية مع دعم كامل للمكالمات الصوتية والدردشة النصية.

![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Agora](https://img.shields.io/badge/Agora-RTC-orange)
![Pusher](https://img.shields.io/badge/Pusher-Real--time-purple)

---

## ✨ المميزات

### 🔐 المصادقة والأمان
- ✅ تسجيل حساب جديد
- ✅ تسجيل دخول مع JWT
- ✅ تسجيل دخول بـ Google (OAuth 2.0)
- ✅ دخول كضيف (Guest)
- ✅ تغيير كلمة المرور
- ✅ Auto-refresh للـ Access Token
- ✅ Protected routes

### 🏠 إدارة الغرف
- ✅ عرض قائمة الغرف ديناميكياً من API
- ✅ إنشاء غرف جديدة (عامة/خاصة)
- ✅ عدد المستخدمين النشطين real-time
- ✅ ترتيب حسب النشاط
- ✅ دعم الغرف الخاصة 🔒

### 🎤 المكالمات الصوتية
- ✅ مكالمات صوتية جماعية عبر Agora
- ✅ كتم/إلغاء كتم الميكروفون
- ✅ عرض المشاركين
- ✅ جودة صوت عالية

### 💬 الدردشة النصية
- ✅ دردشة نصية في الوقت الفعلي عبر Pusher
- ✅ عرض المستخدمين المتصلين
- ✅ Timestamps للرسائل

### 🎨 التصميم
- ✅ تصميم متجاوب (Mobile/Desktop)
- ✅ Dark theme مع تدرجات ملونة
- ✅ Animations جميلة
- ✅ PWA - قابل للتثبيت

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 18+
- npm أو yarn
- حساب Agora (للمكالمات الصوتية)
- حساب Pusher (للدردشة النصية)

### التثبيت

1. **استنساخ المشروع:**
```bash
git clone <repository-url>
cd voice-chat-pwa
```

2. **تثبيت Dependencies:**
```bash
npm install
```

3. **إعداد Environment Variables:**

إنشاء ملف `.env.local` في المجلد الرئيسي:

```env
# API Base URL
NEXT_PUBLIC_API_URL=https://your-api.com/api/auth

# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
NEXT_PUBLIC_AGORA_TOKEN=your_static_token_or_leave_empty
AGORA_PRIMARY_CERTIFICATE=your_agora_primary_certificate

# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

4. **تشغيل التطبيق:**
```bash
npm run dev
```

5. **افتح المتصفح:**
```
http://localhost:3000
```

---

## 📚 التوثيق

الملفات التالية تحتوي على توثيق مفصل:

- **[NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)** - ⭐ إعداد Environment Variables في Netlify
- **[LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md)** - ⭐ دليل إعداد التطوير المحلي
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - ملخص شامل للمشروع
- **[AUTH_INTEGRATION.md](./AUTH_INTEGRATION.md)** - دليل نظام المصادقة
- **[CHATROOMS_API_INTEGRATION.md](./CHATROOMS_API_INTEGRATION.md)** - دليل تكامل Chat Rooms API
- **[AGORA_TOKEN_ARCHITECTURE.md](./AGORA_TOKEN_ARCHITECTURE.md)** - معمارية توليد Agora Tokens
- **[CREATE_ROOM_FEATURE.md](./CREATE_ROOM_FEATURE.md)** - توثيق ميزة إنشاء الغرف
- **[CHANGE_PASSWORD_FEATURE.md](./CHANGE_PASSWORD_FEATURE.md)** - توثيق تغيير كلمة المرور
- **[REDIRECT_FIX.md](./REDIRECT_FIX.md)** - إصلاح مشكلة التحويل

---

## 🏗️ هيكل المشروع

```
voice-chat-pwa/
├── app/                        # صفحات Next.js
│   ├── page.tsx               # الصفحة الرئيسية
│   ├── login/                 # تسجيل الدخول
│   ├── register/              # التسجيل
│   └── change-password/       # تغيير كلمة المرور
│
├── components/                 # مكونات React
│   ├── VoiceChatRoom.tsx      # الغرفة الصوتية
│   ├── InstallPWAButton.tsx   # زر تثبيت PWA
│   └── chat/                  # مكونات الدردشة
│
├── contexts/                   # React Contexts
│   └── AuthContext.tsx        # إدارة المصادقة
│
├── hooks/                      # Custom Hooks
│   ├── useAgoraVoice.ts       # Agora voice hook
│   └── usePusherChat.ts       # Pusher chat hook
│
├── lib/                        # Services & Utilities
│   ├── authService.ts         # خدمات المصادقة
│   └── chatRoomsService.ts    # خدمات الغرف
│
├── netlify/                    # Netlify Functions
│   └── functions/
│       ├── agora-token.ts     # توليد Agora Tokens
│       └── pusher-auth.ts     # مصادقة Pusher
│
└── public/                     # الملفات الثابتة
    ├── manifest.json          # PWA manifest
    └── service-worker.js      # Service Worker
```

---

## 🔧 التقنيات المستخدمة

### Frontend
- **Next.js 16** - React Framework
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling

### Authentication
- **NextAuth.js** - OAuth & Session Management
- **Google OAuth 2.0** - Social Login
- **JWT** - Token-based Authentication

### Real-time Communication
- **Agora RTC SDK** - Voice/Video calls
- **Pusher** - Text chat & presence

### Backend Integration
- **Chat Room API** - External API
- **RESTful API** - Backend communication

---

## 📱 PWA Features

التطبيق يدعم Progressive Web App:
- ✅ قابل للتثبيت على الأجهزة
- ✅ يعمل Offline (Service Worker)
- ✅ App-like experience
- ✅ Push notifications (قابل للتفعيل)

---

## 🔐 الأمان

### تم تنفيذه:
- JWT Authentication (Access + Refresh Tokens)
- Access Token: 15 دقيقة
- Refresh Token: 7 أيام
- Auto-refresh كل 10 دقائق
- Password validation (8+ chars, uppercase, lowercase, number)
- Protected routes

### توصيات للإنتاج:
- استخدام httpOnly cookies
- HTTPS فقط
- CSRF protection
- Rate limiting
- Input sanitization

---

## 📊 API Endpoints

### Authentication API
```
POST /api/auth/register           - تسجيل حساب جديد
POST /api/auth/login              - تسجيل دخول
POST /api/auth/google-login       - تسجيل دخول بـ Google
POST /api/auth/guest-login        - دخول كضيف
POST /api/auth/refresh-token      - تحديث Token
POST /api/auth/logout             - تسجيل خروج
POST /api/auth/change-password    - تغيير كلمة المرور
GET  /api/auth/me                 - معلومات المستخدم الحالي
```

### Chat Rooms API
```
GET  /api/chatrooms               - قائمة الغرف
POST /api/chatrooms               - إنشاء غرفة
POST /api/chatrooms/{id}/join     - الانضمام
POST /api/chatrooms/{id}/leave    - المغادرة
DELETE /api/chatrooms/{id}/members/{userId}  - إزالة عضو
POST /api/chatrooms/{id}/ban      - حظر مستخدم
POST /api/chatrooms/{id}/mute     - كتم مستخدم
```

---

## 🚀 النشر (Deployment)

### Netlify Deployment

1. **ربط المشروع بـ Netlify:**
   - افتح [Netlify Dashboard](https://app.netlify.com)
   - اختر "Add new site" → "Import an existing project"
   - اربط GitHub repository

2. **إعداد Build Settings:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **إعداد Environment Variables:**

   **📋 اتبع التعليمات في:** [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)

   المتغيرات المطلوبة:
   - `NEXTAUTH_URL` - رابط الموقع
   - `NEXTAUTH_SECRET` - مفتاح التشفير
   - `GOOGLE_CLIENT_ID` - Google OAuth
   - `GOOGLE_CLIENT_SECRET` - Google OAuth
   - `NEXT_PUBLIC_API_URL` - Backend API
   - `NEXT_PUBLIC_AGORA_APP_ID` - Agora voice
   - `AGORA_PRIMARY_CERTIFICATE` - Agora token generation
   - `NEXT_PUBLIC_PUSHER_KEY` - Pusher chat
   - `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher region
   - `PUSHER_APP_ID` - Pusher functions
   - `PUSHER_SECRET` - Pusher functions

4. **إعداد Google OAuth:**
   - في [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - أضف redirect URI: `https://your-domain.com/api/auth/callback/google`

5. **Deploy:**
   - Netlify سينشر تلقائياً عند push إلى GitHub
   - أو اضغط "Trigger deploy" يدوياً

### Domain Setup

- في Netlify → Domain settings
- أضف custom domain أو استخدم netlify subdomain
- تأكد من تحديث `NEXTAUTH_URL` بالـ domain الجديد

---

## 🎯 الميزات القادمة

- [ ] SignalR للإشعارات الفورية
- [ ] لوحة تحكم للمشرفين
- [ ] البحث عن غرف
- [ ] Video calls support
- [ ] Screen sharing
- [ ] File sharing
- [ ] Emoji reactions
- [ ] Dark/Light theme toggle

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

---

**صُنع بـ ❤️ باستخدام Next.js & React**

**النسخة:** 1.0.0
**آخر تحديث:** 2025-11-01
