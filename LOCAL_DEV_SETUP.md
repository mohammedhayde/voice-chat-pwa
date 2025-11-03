# 🛠️ إعداد التطوير المحلي (Local Development)

## المشكلة

عند استخدام `npm run dev` للتطوير المحلي، Netlify Functions لا تعمل (تعطي 404).

```
GET /.netlify/functions/agora-token?channel=room-1&uid=656077 404
❌ Failed to get Agora token
```

## الحل المُطبق ✅

تم إنشاء **Next.js API Route** يعمل محلياً وينفذ نفس وظيفة Netlify Function:

### 1. ملف API Route الجديد
**الموقع:** `app/api/agora-token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const uid = searchParams.get('uid');

  // يولد Agora Token باستخدام نفس منطق Netlify Function
  const token = RtcTokenBuilder.buildTokenWithUid(...);

  return NextResponse.json({ token, appId, channel, uid, ... });
}
```

### 2. التبديل التلقائي في التطبيق
**الموقع:** `app/page.tsx:150-153`

```typescript
// استخدام Next.js API route للتطوير المحلي، Netlify Function للإنتاج
const tokenEndpoint = process.env.NODE_ENV === 'production'
  ? `/.netlify/functions/agora-token?channel=${channelName}&uid=${uid}`
  : `/api/agora-token?channel=${channelName}&uid=${uid}`;

const tokenResponse = await fetch(tokenEndpoint);
```

---

## كيف يعمل؟

### في وضع التطوير (npm run dev):
```
المستخدم → /api/agora-token → Next.js API Route
                              ↓
                        يولد Agora Token
                              ↓
                        يرجع Token للمستخدم
```

### في وضع الإنتاج (Netlify):
```
المستخدم → /.netlify/functions/agora-token → Netlify Function
                                            ↓
                                      يولد Agora Token
                                            ↓
                                      يرجع Token للمستخدم
```

---

## متطلبات التشغيل

### 1. Environment Variables
تأكد من وجود المتغيرات التالية في `.env.local`:

```env
# Agora App ID (مطلوب)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Agora Primary Certificate (مطلوب)
AGORA_PRIMARY_CERTIFICATE=your_agora_primary_certificate

# API Base URL
NEXT_PUBLIC_API_URL=https://your-api.com/api/auth

# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 2. تشغيل التطبيق

```bash
# التثبيت (إذا لم يكن مثبتاً)
npm install

# التطوير المحلي
npm run dev
```

الآن يمكنك فتح http://localhost:3000 والتطبيق يعمل بالكامل! ✅

---

## التحقق من أن كل شيء يعمل

### 1. افتح Developer Console (F12)

### 2. سجل دخول واختر غرفة

### 3. راقب Console Logs:
يجب أن ترى:
```
🔐 [JOIN] Joining room 1 via API...
✅ [JOIN] Registered as room member
🎫 [TOKEN] Getting Agora token from token service...
✅ [TOKEN] Generated Agora token for channel: room-1    // ← من API Route
✅ [TOKEN] Got Agora token from function
```

### 4. تحقق من Network Tab:
يجب أن ترى:
```
GET /api/agora-token?channel=room-1&uid=123456  200 OK
```

✅ **إذا رأيت هذا، كل شيء يعمل بشكل صحيح!**

---

## الحلول البديلة (اختياري)

### الخيار 1: استخدام Netlify Dev (غير موصى به للتطوير اليومي)

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تشغيل Netlify Dev
netlify dev
```

**الميزات:**
- ✅ يحاكي بيئة Netlify بالكامل
- ✅ Netlify Functions تعمل محلياً

**العيوب:**
- ❌ أبطأ من `npm run dev`
- ❌ يحتاج Netlify CLI
- ❌ قد يكون معقداً للإعداد

### الخيار 2: Static Token (للاختبار فقط)

إضافة static token في `.env.local`:
```env
NEXT_PUBLIC_AGORA_TOKEN=your_static_token_from_agora_console
```

**الميزات:**
- ✅ سريع للاختبار

**العيوب:**
- ❌ غير آمن للإنتاج
- ❌ Token ينتهي بعد فترة
- ❌ لا يعكس سلوك الإنتاج

---

## النشر على Netlify

عند النشر على Netlify، التطبيق يستخدم Netlify Function تلقائياً:

### 1. أضف Environment Variables في Netlify:
افتح Netlify Dashboard → Site Settings → Environment Variables:

```
NEXT_PUBLIC_AGORA_APP_ID=...
AGORA_PRIMARY_CERTIFICATE=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu
NEXT_PUBLIC_API_URL=...
```

### 2. Deploy:
```bash
git add .
git commit -m "Add local dev setup for Agora tokens"
git push
```

Netlify سيقوم بـ build ونشر التطبيق تلقائياً.

---

## استكشاف الأخطاء

### خطأ: "Missing Agora credentials"

**السبب:** `AGORA_PRIMARY_CERTIFICATE` غير موجود في `.env.local`

**الحل:**
```bash
# تحقق من المتغير
cat .env.local | grep AGORA_PRIMARY_CERTIFICATE

# إذا لم يكن موجوداً، أضفه
echo "AGORA_PRIMARY_CERTIFICATE=your_certificate_here" >> .env.local
```

### خطأ: "Failed to get Agora token"

**السبب:** API route لم يتم compile بعد أو هناك خطأ في الـ token generation

**الحل:**
1. تحقق من Console logs في terminal
2. تحقق من Browser Console للمزيد من التفاصيل
3. أعد تشغيل `npm run dev`

### خطأ: Token غير صالح في Agora

**السبب:** Primary Certificate خاطئ

**الحل:**
1. افتح [Agora Console](https://console.agora.io/)
2. اذهب لمشروعك → Project Management
3. انسخ Primary Certificate الصحيح
4. حدّث `.env.local`
5. أعد تشغيل `npm run dev`

---

## الملخص

✅ **التطوير المحلي:** يستخدم `/api/agora-token` (Next.js API Route)
✅ **الإنتاج على Netlify:** يستخدم `/.netlify/functions/agora-token` (Netlify Function)
✅ **التبديل التلقائي:** يتم بناءً على `NODE_ENV`
✅ **نفس الوظيفة:** كلاهما يولد Agora Tokens بنفس الطريقة

---

**آخر تحديث:** 2025-11-01
**الإصدار:** 1.0.0
