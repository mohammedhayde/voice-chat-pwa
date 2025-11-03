# 🔧 حل مشكلة: Failed to invoke 'JoinRoom' due to an error on the server

**التاريخ:** 2025-11-01
**الخطأ:** `Failed to invoke 'JoinRoom' due to an error on the server`

---

## 🔍 تحليل المشكلة

هذا الخطأ يظهر عندما:
- ✅ Frontend يتصل بـ SignalR بنجاح
- ❌ Backend يرفض طلب `JoinRoom`

---

## 🎯 الأسباب والحلول

### 1. ❌ Backend لا يعمل

**كيف تتحقق؟**
```bash
# جرّب الاتصال بـ Backend:
curl https://localhost:7065/chathub
# أو
curl http://localhost:5000/chathub
```

**الحل:**
- شغّل Backend API (ASP.NET Core)
- تأكد من أنه يعمل على نفس URL

---

### 2. ❌ Backend URL خاطئ

**الكود يستخدم:**
```typescript
// في hooks/useSignalR.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '').replace('/api', '') || 'http://localhost:5209';
const SIGNALR_HUB_URL = `${API_BASE_URL}/chatHub`;
```

**التحقق:**
افتح Console (F12) وابحث عن:
```
🔌 [SIGNALR] Initializing connection to: http://localhost:5209/chatHub
```

**إذا كان URL خاطئ:**

في `.env.local`:
```env
# ✅ صحيح
NEXT_PUBLIC_API_URL=http://localhost:5209/api

# ❌ خطأ
NEXT_PUBLIC_API_URL=http://localhost:5000/api  # بورت خاطئ
```

---

### 3. ❌ JWT Token غير صالح

**كيف تتحقق؟**

في Console (F12):
```javascript
console.log('Token:', localStorage.getItem('accessToken'));
```

**إذا كانت النتيجة `null`:**
- سجل دخول من جديد
- Token انتهت صلاحيته

**الحل:**
```javascript
// احذف Token القديم
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// سجل دخول من جديد
window.location.href = '/login';
```

---

### 4. ❌ CORS مشكلة

**الأعراض:**
```
Access to XMLHttpRequest at 'https://localhost:7065/chathub/negotiate'
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**الحل في Backend:**

تأكد من أن Backend يسمح بـ CORS:

```csharp
// في Startup.cs أو Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

---

### 5. ❌ SignalR Hub غير مُفعّل في Backend

**التحقق:**

في Backend `Program.cs`:
```csharp
// يجب أن يكون موجود:
app.MapHub<ChatHub>("/chathub");
```

**إذا لم يكن موجوداً:**
- Backend لا يدعم SignalR بعد
- استخدم Pusher كبديل مؤقت

---

### 6. ❌ Room ID غير صحيح

**الكود الحالي:**
```typescript
useSignalR({
  roomId: roomId || 0,  // ❌ إذا كان 0، قد يسبب مشكلة
  userName
})
```

**الحل:**
تأكد من أن `roomId` موجود وصحيح:
```typescript
if (!roomId || roomId === 0) {
  console.error('❌ Invalid room ID');
  return;
}
```

---

## 🧪 خطوات التشخيص

### الخطوة 1: افتح Console (F12)

ابحث عن هذه الـ Logs:

**✅ نجح الاتصال:**
```
🔌 [SIGNALR] Initializing connection to: https://localhost:7065/chathub
✅ [SIGNALR] Connected successfully
```

**❌ فشل JoinRoom:**
```
❌ [SIGNALR] Connection failed: Error: ...
```

---

### الخطوة 2: تحقق من Network Tab

1. افتح Developer Tools (F12)
2. اذهب إلى تبويب **Network**
3. ابحث عن:
   - `negotiate` - طلب الاتصال بـ SignalR
   - `chathub` - WebSocket connection

**إذا كان Status Code:**
- `200` ✅ - الاتصال نجح
- `401` ❌ - Token غير صالح
- `404` ❌ - URL خاطئ
- `500` ❌ - خطأ في Backend

---

### الخطوة 3: تحقق من Backend Logs

في Backend Console، ابحث عن:
```
❌ Error: User not found
❌ Error: Room not found
❌ Error: Invalid token
```

---

## 🔧 الحلول السريعة

### الحل 1: تحديث `.env.local`

```env
# أضف أو حدّث:
NEXT_PUBLIC_API_URL=http://localhost:5209/api
```

### الحل 2: إعادة تسجيل الدخول

```javascript
// في Console:
localStorage.clear();
location.reload();
// ثم سجل دخول من جديد
```

### الحل 3: إعادة تشغيل Frontend

```bash
# أوقف السيرفر (Ctrl+C)
# ثم شغّل من جديد
npm run dev
```

### الحل 4: تحقق من Backend

```bash
# تأكد من أن Backend يعمل:
curl http://localhost:5209/api/health
# أو
curl http://localhost:5209/chatHub
```

---

## 🛡️ Fallback: استخدام Pusher مؤقتاً

إذا استمرت المشكلة ولا يمكن حلها الآن، يمكنك العودة لـ Pusher مؤقتاً:

### الخطوة 1: أعد تثبيت Pusher

```bash
npm install pusher-js
```

### الخطوة 2: أعد Hook Pusher

ارجع للنسخة القديمة من `VoiceChatRoom.tsx` التي تستخدم `usePusherChat`

---

## 📋 Checklist للتشخيص

قبل أن تسأل عن المساعدة، تأكد من:

- [ ] Backend يعمل (`curl http://localhost:5209/chatHub`)
- [ ] `.env.local` يحتوي على `NEXT_PUBLIC_API_URL=http://localhost:5209/api`
- [ ] JWT Token موجود (`localStorage.getItem('accessToken')`)
- [ ] Room ID صحيح وموجود
- [ ] CORS مُفعّل في Backend
- [ ] SignalR Hub مُفعّل (`app.MapHub<ChatHub>("/chatHub")`)

---

## 🎯 الخطوة التالية

بعد تحديث `.env.local`:

```bash
# 1. أوقف السيرفر (Ctrl+C)
# 2. أعد التشغيل
npm run dev

# 3. أعد تحميل الصفحة في المتصفح (Ctrl+R)
# 4. افتح Console وتابع الـ Logs
```

---

## 📞 إذا استمرت المشكلة

أرسل:
1. **Console Logs كاملة** (من F12)
2. **Network Tab** - screenshot من طلب `negotiate`
3. **Backend Logs** - إذا متاح
4. **`.env.local`** - السطر الخاص بـ `NEXT_PUBLIC_API_URL`

---

**آخر تحديث:** 2025-11-01
**الحالة:** قيد الحل
