# Google OAuth Setup Guide

## ما تم إنجازه ✅

تم تطوير نظام مصادقة متكامل باستخدام Google OAuth مع NextAuth.js:

### 1. **المكونات الأساسية**
- ✅ NextAuth.js مع Google Provider
- ✅ التكامل مع Backend API (`/api/auth/external-login`)
- ✅ زر تسجيل دخول Google في صفحات Login و Register
- ✅ دمج NextAuth session مع AuthContext الموجود
- ✅ دعم المصادقة التقليدية و Google OAuth معاً

### 2. **الملفات المضافة**
```
app/api/auth/[...nextauth]/route.ts    # NextAuth configuration
components/GoogleSignInButton.tsx       # Google sign-in button component
components/SessionProvider.tsx          # NextAuth session wrapper
types/next-auth.d.ts                    # TypeScript types extension
```

### 3. **الملفات المحدثة**
```
app/layout.tsx                          # Added SessionProvider
app/login/page.tsx                      # Added Google sign-in button
app/register/page.tsx                   # Added Google sign-in button
contexts/AuthContext.tsx                # Integrated with NextAuth
.env.example                            # Added Google OAuth variables
```

---

## كيفية الإعداد 🛠️

### الخطوة 1: إعداد Google OAuth

1. **افتح [Google Cloud Console](https://console.cloud.google.com/)**
2. **أنشئ مشروع جديد** (أو استخدم مشروع موجود)
3. **فعّل Google+ API:**
   - انتقل إلى "APIs & Services" > "Library"
   - ابحث عن "Google+ API"
   - اضغط "Enable"

4. **أنشئ OAuth 2.0 Credentials:**
   - اذهب إلى "APIs & Services" > "Credentials"
   - اضغط "Create Credentials" > "OAuth client ID"
   - اختر "Web application"
   - أضف **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/callback/google
     https://drdsh.me/api/auth/callback/google
     https://un4chat.netlify.app/api/auth/callback/google
     ```
   - احفظ الـ **Client ID** و **Client Secret**

### الخطوة 2: إعداد المتغيرات البيئية

أضف المتغيرات التالية في ملف `.env.local`:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://drdsh.me
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**ملاحظة:** للتطوير المحلي، يمكنك استخدام `http://localhost:3000` في `NEXTAUTH_URL`.

**لإنشاء NEXTAUTH_SECRET جديد (اختياري):**
```bash
openssl rand -base64 32
```

### الخطوة 3: إعداد Netlify (للإنتاج)

1. افتح إعدادات موقعك في Netlify
2. اذهب إلى **Site settings** > **Environment variables**
3. أضف المتغيرات التالية:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://drdsh.me` |
| `NEXTAUTH_SECRET` | (القيمة من openssl) |
| `GOOGLE_CLIENT_ID` | (Client ID من Google Console) |
| `GOOGLE_CLIENT_SECRET` | (Client Secret من Google Console) |

---

## كيف يعمل النظام 🔄

### Flow الكامل:

```
1. المستخدم يضغط "تسجيل الدخول بـ Google"
   ↓
2. NextAuth يعيد توجيهه إلى Google OAuth
   ↓
3. المستخدم يوافق على الصلاحيات
   ↓
4. Google يعيد idToken إلى NextAuth
   ↓
5. NextAuth يرسل طلب إلى Backend:
   POST /api/auth/external-login
   {
     "provider": "Google",
     "idToken": "...",
     "email": "user@gmail.com",
     "name": "Ahmed Ali",
     "profilePicture": "https://..."
   }
   ↓
6. Backend يُرجع:
   {
     "success": true,
     "token": "JWT_ACCESS_TOKEN",
     "refreshToken": "REFRESH_TOKEN",
     "user": {
       "id": 123,
       "username": "AhmedAli_5432",
       "email": "user@gmail.com",
       ...
     }
   }
   ↓
7. NextAuth يخزن البيانات في session
   ↓
8. AuthContext يحفظ tokens في localStorage
   ↓
9. المستخدم يُعاد توجيهه للصفحة الرئيسية
```

### الدمج مع AuthContext:

```typescript
// AuthContext يتحقق من NextAuth session أولاً
if (session?.user) {
  // استخدم بيانات Google OAuth
  const user = {
    userId: session.user.userId,
    username: session.user.username,
    isGuest: false
  };

  // احفظ tokens للـ API calls
  localStorage.setItem('accessToken', session.user.backendToken);
  localStorage.setItem('refreshToken', session.user.refreshToken);
}
```

---

## الاستخدام في الكود 💻

### 1. الوصول إلى Session:

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not signed in</div>;

  return (
    <div>
      <p>Welcome {session.user.name}</p>
      <p>Username: {session.user.username}</p>
      <p>User ID: {session.user.userId}</p>
    </div>
  );
}
```

### 2. الوصول عبر AuthContext (موحد):

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <div>Not signed in</div>;

  return (
    <div>
      <p>Welcome {user.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. تسجيل الخروج:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();

  // يتعامل تلقائياً مع NextAuth و traditional auth
  return <button onClick={logout}>Logout</button>;
}
```

---

## API Calls مع Tokens 🔐

جميع API calls تستخدم tokens من localStorage تلقائياً:

```typescript
// في authService.ts
const accessToken = localStorage.getItem('accessToken');

fetch('/api/chatrooms', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

Tokens يتم تحديثها تلقائياً كل 10 دقائق عبر AuthContext.

---

## التوافق مع الأنظمة القديمة 🔄

النظام يدعم:
- ✅ تسجيل الدخول التقليدي (Username/Password)
- ✅ تسجيل الدخول بـ Google OAuth
- ✅ تسجيل الدخول كضيف
- ✅ جميع الأنظمة تعمل معاً بسلاسة

---

## Troubleshooting 🔧

### المشكلة: "redirect_uri_mismatch"
**الحل:** تأكد من إضافة redirect URI الصحيح في Google Cloud Console:
```
https://drdsh.me/api/auth/callback/google
```

### المشكلة: "Invalid client secret"
**الحل:** تأكد من نسخ `GOOGLE_CLIENT_SECRET` بشكل صحيح من Google Console.

### المشكلة: Session غير موجود
**الحل:** تأكد من إضافة `SessionProvider` في `layout.tsx`.

### المشكلة: Tokens لا تُحفظ
**الحل:** تحقق من أن Backend يُرجع `token` و `refreshToken` في response.

---

## المزايا 🌟

✅ **تسجيل دخول سريع** - بنقرة واحدة عبر Google
✅ **أمان محسّن** - OAuth 2.0 standard
✅ **تجربة مستخدم أفضل** - لا حاجة لتذكر كلمة مرور
✅ **دعم متعدد** - يعمل مع أنظمة المصادقة الموجودة
✅ **TypeScript Safe** - Types كاملة للـ session

---

## Resources 📚

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://console.cloud.google.com/)
- [Next.js App Router Auth](https://next-auth.js.org/configuration/initialization#route-handlers-app)
