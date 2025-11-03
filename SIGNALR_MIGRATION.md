# 🔄 الانتقال من Pusher إلى SignalR

**التاريخ:** 2025-11-01
**الحالة:** ✅ مُكتمل

---

## 📝 الملخص

تم استبدال **Pusher** بـ **SignalR** للحصول على:
- ✅ اتصال أسرع وأكثر استقراراً
- ✅ تكامل أفضل مع Backend (ASP.NET Core)
- ✅ دعم كامل لميزات الإدارة (حظر، كتم، طرد)
- ✅ إشعارات فورية real-time
- ✅ توفير في التكاليف (لا حاجة لخدمة خارجية)

---

## 🔧 التغييرات التقنية

### 1. التثبيت

```bash
npm install @microsoft/signalr
```

### 2. الملفات الجديدة

**`hooks/useSignalR.ts`** - Custom Hook لـ SignalR

```typescript
import { useSignalR } from '@/hooks/useSignalR';

const { messages, isConnected, connectedUsers, sendMessage } = useSignalR({
  roomId: 5,
  userName: 'أحمد',
  onBanned: (reason) => alert(`تم حظرك: ${reason}`),
  onMuted: (reason, expiresAt) => alert(`تم كتمك: ${reason}`)
});
```

### 3. الملفات المُعدلة

#### `components/VoiceChatRoom.tsx`

**قبل (Pusher):**
```typescript
import { usePusherChat } from '@/hooks/usePusherChat';

const {
  messages,
  isConnected: isChatConnected,
  connectedUsers,
  sendMessage,
} = usePusherChat({
  appKey: pusherAppKey,
  cluster: pusherCluster,
  channelName,
  userName
});
```

**بعد (SignalR):**
```typescript
import { useSignalR } from '@/hooks/useSignalR';

const {
  messages,
  isConnected: isChatConnected,
  connectedUsers,
  sendMessage: sendSignalRMessage,
} = useSignalR({
  roomId: roomId || 0,
  userName,
  onBanned: (reason) => {
    alert(`🚫 تم حظرك من الغرفة\nالسبب: ${reason}`);
    router.push('/');
  },
  onMuted: (reason, expiresAt) => {
    const until = expiresAt ? new Date(expiresAt).toLocaleString('ar-SA') : 'دائماً';
    alert(`🔇 تم كتمك من الغرفة\nالسبب: ${reason}\nحتى: ${until}`);
  }
});
```

#### `app/page.tsx`

**تمت إزالة:**
```typescript
// ❌ لم تعد بحاجة لهذه
pusherAppKey={PUSHER_APP_KEY}
pusherCluster={PUSHER_CLUSTER}
```

---

## 🎯 الميزات الجديدة

### 1. الحظر (Ban) - Real-time

عندما يتم حظرك من الغرفة:
```typescript
// SignalR يرسل إشعار فوري
connection.on('RoomBanned', (roomId, reason, isPermanent, expiresAt) => {
  alert(`🚫 تم حظرك من الغرفة\nالسبب: ${reason}`);
  router.push('/'); // إعادة توجيه للصفحة الرئيسية
});
```

### 2. الكتم (Mute) - Real-time

عندما يتم كتمك:
```typescript
connection.on('YouWereMuted', (roomId, reason, isPermanent, expiresAt) => {
  const until = expiresAt ? new Date(expiresAt).toLocaleString('ar-SA') : 'دائماً';
  alert(`🔇 تم كتمك\nحتى: ${until}`);
  // تعطيل إدخال الرسائل تلقائياً
});
```

### 3. المستخدمون المحظورون

عندما يتم حظر مستخدم آخر، يتم إزالته تلقائياً من القائمة:
```typescript
connection.on('UserBanned', (roomId, userId, username, bannedByUsername, reason) => {
  // إزالة المستخدم من connectedUsers
  setConnectedUsers(prev => prev.filter(u => u.id !== String(userId)));
});
```

### 4. إعادة الاتصال التلقائي

SignalR يُعيد الاتصال تلقائياً عند انقطاع الشبكة:
```typescript
.withAutomaticReconnect({
  nextRetryDelayInMilliseconds: (retryContext) => {
    // 2s, 5s, 10s, 30s
    return Math.min(2000 * (retryContext.previousRetryCount + 1), 30000);
  }
})
```

---

## 📊 مقارنة Pusher vs SignalR

| الميزة | Pusher | SignalR |
|--------|--------|---------|
| **التكلفة** | مدفوع (بعد الحد المجاني) | مجاني (مدمج مع Backend) |
| **التكامل** | خدمة خارجية | مُدمج مع ASP.NET Core |
| **السرعة** | جيد | أسرع (نفس السيرفر) |
| **الإعداد** | يحتاج API Keys | JWT Token فقط |
| **Real-time Events** | محدود | كامل (Ban, Mute, Kick) |
| **إعادة الاتصال** | يدوي | تلقائي |
| **Debugging** | صعب (خدمة خارجية) | سهل (logs محلية) |

---

## 🔐 المصادقة (Authentication)

### Pusher (القديم):
```typescript
// لا توجد مصادقة قوية
const pusher = new Pusher(appKey, {
  cluster: cluster
  // لا يُرسل JWT Token
});
```

### SignalR (الجديد):
```typescript
// مصادقة قوية بـ JWT
const connection = new signalR.HubConnectionBuilder()
  .withUrl(SIGNALR_HUB_URL, {
    accessTokenFactory: () => localStorage.getItem('accessToken'),
    // ✅ كل طلب مُصادق عليه
  })
  .build();
```

---

## 📡 الأحداث المدعومة

### الأحداث التي يرسلها Server:

| الحدث | الوصف | البيانات |
|------|-------|----------|
| `ReceiveMessage` | رسالة جديدة | `{id, userId, username, content, sentAt}` |
| `UserJoined` | مستخدم انضم | `{roomId, userId, username}` |
| `UserLeft` | مستخدم غادر | `{roomId, userId, username}` |
| `RoomBanned` | أنت محظور | `{roomId, reason, isPermanent, expiresAt}` |
| `YouWereMuted` | أنت مكتوم | `{roomId, reason, isPermanent, expiresAt}` |
| `UserBanned` | مستخدم تم حظره | `{roomId, userId, username, bannedByUsername, reason}` |
| `UserMuted` | مستخدم تم كتمه | `{roomId, userId, username, mutedByUsername, reason}` |
| `MessageDeleted` | رسالة محذوفة | `{messageId, roomId}` |

### Methods للاستدعاء:

| Method | الوصف | Parameters |
|--------|-------|------------|
| `JoinRoom` | الانضمام لغرفة | `roomId` |
| `LeaveRoom` | مغادرة الغرفة | `roomId` |
| `SendMessage` | إرسال رسالة | `roomId, content` |
| `BanUser` | حظر مستخدم | `roomId, userId, reason, isPermanent, expiresAt` |
| `MuteUser` | كتم مستخدم | `roomId, userId, reason, isPermanent, expiresAt` |
| `KickUser` | طرد مستخدم | `roomId, userId` |

---

## 🧪 الاختبار

### 1. اختبار الاتصال

```bash
# شغّل التطبيق
npm run dev

# افتح Console (F12)
# ابحث عن:
✅ [SIGNALR] Connected successfully
✅ [SIGNALR] Joined room 5
```

### 2. اختبار الرسائل

```javascript
// في Console:
console.log('Messages:', messages);
console.log('Connected:', isConnected);
console.log('Users:', connectedUsers);
```

### 3. اختبار الحظر

```javascript
// كمشرف، احظر مستخدم
// يجب أن يرى المستخدم المحظور:
🚫 تم حظرك من الغرفة
السبب: سلوك غير لائق
```

### 4. اختبار الكتم

```javascript
// كمشرف، اكتم مستخدم
// يجب أن يرى المستخدم المكتوم:
🔇 تم كتمك من الغرفة
السبب: spam
حتى: 2025-11-01 18:30:00
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا يتصل SignalR

**Console Logs:**
```
❌ [SIGNALR] Connection failed: Error: ...
```

**الحلول:**
1. تحقق من Backend URL في `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=https://localhost:7065/api
   ```

2. تحقق من أن Backend يعمل:
   ```bash
   curl https://localhost:7065/chathub
   ```

3. تحقق من JWT Token:
   ```javascript
   console.log('Token:', localStorage.getItem('accessToken'));
   ```

### المشكلة: الرسائل لا تُرسل

**Error:**
```
Failed to send message: You are muted
```

**السبب:** أنت مكتوم!

**الحل:** انتظر انتهاء مدة الكتم أو اطلب من المشرف إلغاء الكتم.

### المشكلة: إعادة الاتصال لا تعمل

**Console Logs:**
```
⚠️ [SIGNALR] Reconnecting...
⚠️ [SIGNALR] Reconnecting...
⚠️ [SIGNALR] Reconnecting...
```

**الحل:**
1. تحقق من الإنترنت
2. تحقق من أن Backend يعمل
3. أعد تحميل الصفحة

---

## 📦 البيئة (Environment Variables)

لا حاجة لمتغيرات Pusher بعد الآن!

**قبل:**
```env
NEXT_PUBLIC_PUSHER_APP_KEY=xxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

**بعد:**
```env
# فقط Backend URL
NEXT_PUBLIC_API_URL=https://localhost:7065/api
```

---

## 🎨 الواجهة (UI)

لا تغيير في الواجهة! كل شيء يعمل بنفس الطريقة:
- ✅ نفس قائمة المتصلين
- ✅ نفس الرسائل
- ✅ نفس الأزرار
- ✅ إشعارات إضافية (حظر، كتم)

---

## 🚀 الخطوات التالية (Optional)

### 1. إزالة Pusher تماماً

```bash
# حذف Pusher packages
npm uninstall pusher-js

# حذف Pusher hook
rm hooks/usePusherChat.ts
```

### 2. تحديث البيئة

```bash
# في .env.local
# ❌ احذف
# NEXT_PUBLIC_PUSHER_APP_KEY=xxxxx
# NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 3. تحديث netlify/functions (إذا موجودة)

```bash
# حذف Pusher auth function
rm netlify/functions/pusher-auth.ts
```

---

## ✅ تم الانتهاء!

الآن التطبيق يستخدم SignalR بالكامل! 🎉

**الميزات الجديدة:**
- ✅ إشعارات فورية للحظر والكتم
- ✅ اتصال أسرع وأكثر استقراراً
- ✅ تكامل كامل مع Backend
- ✅ مصادقة قوية بـ JWT
- ✅ إعادة اتصال تلقائي

---

**آخر تحديث:** 2025-11-01
**الإصدار:** 2.0.0 (SignalR)
