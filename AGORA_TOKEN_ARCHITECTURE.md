# 🎫 Agora Token Architecture

## 📋 نظرة عامة

التطبيق يستخدم معمارية **مفصولة** لتوليد Agora Tokens بحيث يتم الفصل بين:
- **إدارة عضوية الغرف** (عبر Chat Rooms API)
- **توليد Agora Tokens** (عبر Netlify Function)

---

## 🏗️ المعمارية

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│                                                               │
│  1. المستخدم يضغط على غرفة                                  │
│                                                               │
│  2. استدعاء Chat Rooms API لتسجيل العضوية                   │
│     POST /api/chatrooms/{roomId}/join                        │
│     ↓                                                         │
│     ✅ تسجيل المستخدم كعضو في الغرفة                        │
│                                                               │
│  3. استدعاء Netlify Function للحصول على Agora Token         │
│     GET /.netlify/functions/agora-token                      │
│     ↓                                                         │
│     ✅ الحصول على token ديناميكي                            │
│                                                               │
│  4. الانضمام لـ Agora Voice Channel                          │
│     باستخدام Token من Netlify Function                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 المكونات

### 1. Chat Rooms API
**المسؤولية:** إدارة عضوية المستخدمين في الغرف

**Endpoint:**
```
POST /api/chatrooms/{roomId}/join
```

**Headers:**
```http
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Joined successfully"
}
```

**ملاحظات:**
- يسجل فقط عضوية المستخدم
- **لا يرجع** Agora Token
- يتطلب Authentication

---

### 2. Netlify Function (agora-token.ts)
**المسؤولية:** توليد Agora Tokens ديناميكياً

**الموقع:**
```
/netlify/functions/agora-token.ts
```

**Endpoint:**
```
GET /.netlify/functions/agora-token
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `channel` | string | ✅ Yes | - | اسم القناة (مثل: room-1) |
| `uid` | number | ❌ No | 0 | معرف المستخدم |
| `role` | string | ❌ No | publisher | دور المستخدم: publisher/audience |

**Response:**
```json
{
  "token": "007eJxT...",
  "appId": "your_agora_app_id",
  "channel": "room-1",
  "uid": 12345,
  "expireTime": 1234567890,
  "expireAt": "2025-11-01T11:00:00.000Z"
}
```

**التنفيذ:**
```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-token';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
const appCertificate = process.env.AGORA_PRIMARY_CERTIFICATE;
const privilegeExpireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour

const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channel,
  uid,
  RtcRole.PUBLISHER,
  privilegeExpireTime,
  privilegeExpireTime
);
```

---

## 🔑 Environment Variables

### Frontend (.env.local)
```env
# Agora App ID (مطلوب للـ SDK)
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Static Token (غير مستخدم، اختياري)
NEXT_PUBLIC_AGORA_TOKEN=optional_static_token
```

### Netlify Function
```env
# Agora Primary Certificate (مطلوب لتوليد Tokens)
AGORA_PRIMARY_CERTIFICATE=your_agora_primary_certificate
```

**كيفية الحصول على Primary Certificate:**
1. افتح [Agora Console](https://console.agora.io/)
2. اختر مشروعك
3. من قسم "Project Management"
4. انسخ **Primary Certificate**

---

## 🔄 التدفق الكامل (Step by Step)

### الخطوة 1: المستخدم يختار غرفة
```typescript
// في app/page.tsx
const handleRoomSelect = async (roomId: number) => {
  // ...
}
```

### الخطوة 2: تسجيل العضوية في Chat Rooms API
```typescript
// استدعاء API لتسجيل العضوية
await joinChatRoom(roomId);
console.log('✅ Registered as room member');
```

### الخطوة 3: الحصول على Agora Token
```typescript
const channelName = `room-${roomId}`;
const uid = Math.floor(Math.random() * 1000000);

const tokenResponse = await fetch(
  `/.netlify/functions/agora-token?channel=${channelName}&uid=${uid}`
);

const tokenData = await tokenResponse.json();
// tokenData.token = "007eJxT..."
```

### الخطوة 4: الانضمام لـ Agora Channel
```typescript
setJoinData({
  agoraToken: tokenData.token,
  channelName: channelName,
  uid: uid,
  tokenExpiration: tokenData.expireTime
});

// ثم يتم تمرير هذه البيانات لـ VoiceChatRoom component
```

---

## ✅ المزايا

### 1. الأمان 🔒
- **Primary Certificate** يبقى في server-side فقط
- لا يتم كشفه للـ client
- Tokens تُولد ديناميكياً لكل طلب

### 2. المرونة 🔧
- Token جديد لكل انضمام
- مدة صلاحية قابلة للتعديل (حالياً: ساعة واحدة)
- يمكن إضافة منطق إضافي (مثل: التحقق من الصلاحيات)

### 3. الاستقلالية 🎯
- فصل كامل بين إدارة الغرف وتوليد Tokens
- Chat Rooms API لا يحتاج معرفة Agora
- يمكن تبديل خدمة الصوت بسهولة

### 4. التحكم 🎛️
- تحكم كامل في مدة صلاحية Token
- يمكن تحديد أدوار مختلفة (publisher/audience)
- يمكن إضافة rate limiting

---

## 🛠️ الكود الكامل

### في app/page.tsx
```typescript
const handleRoomSelect = async (roomId: number) => {
  setJoiningRoom(true);
  setJoinError('');

  try {
    // 1. Join room via API to register membership
    console.log('🔐 [JOIN] Joining room', roomId, 'via API...');
    await joinChatRoom(roomId);
    console.log('✅ [JOIN] Registered as room member');

    // 2. Get Agora token from Netlify Function
    console.log('🎫 [TOKEN] Getting Agora token from agora-token function...');
    const channelName = `room-${roomId}`;
    const uid = Math.floor(Math.random() * 1000000);

    const tokenResponse = await fetch(
      `/.netlify/functions/agora-token?channel=${channelName}&uid=${uid}`
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Agora token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ [TOKEN] Got Agora token from function');

    // 3. Set join data
    setJoinData({
      success: true,
      message: 'Joined successfully',
      agoraToken: tokenData.token,
      channelName: channelName,
      uid: uid,
      tokenExpiration: tokenData.expireTime
    });

    setSelectedRoom(roomId);
    setIsConfigured(true);
  } catch (err: any) {
    console.error('❌ [JOIN] Failed to join room:', err);
    setJoinError(err.message || 'فشل في الانضمام للغرفة');
  } finally {
    setJoiningRoom(false);
  }
};
```

### في lib/chatRoomsService.ts
```typescript
// الانضمام للغرفة (تسجيل العضوية فقط)
export async function joinChatRoom(roomId: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(`${CHATROOMS_URL}/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'فشل في الانضمام للغرفة');
  }

  // لا نحفظ Agora token هنا - سنحصل عليه من agora-token function
}
```

---

## 🧪 الاختبار

### 1. اختبار Netlify Function محلياً

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تشغيل Netlify Dev
netlify dev
```

ثم اختبر:
```bash
curl "http://localhost:8888/.netlify/functions/agora-token?channel=test-room&uid=12345"
```

**الاستجابة المتوقعة:**
```json
{
  "token": "007eJxT...",
  "appId": "your_app_id",
  "channel": "test-room",
  "uid": 12345,
  "expireTime": 1234567890,
  "expireAt": "2025-11-01T11:00:00.000Z"
}
```

### 2. اختبار التدفق الكامل

1. **سجل دخول** للتطبيق
2. **اختر غرفة**
3. **راقب Console logs:**
   ```
   🔐 [JOIN] Joining room 1 via API...
   ✅ [JOIN] Registered as room member
   🎫 [TOKEN] Getting Agora token from agora-token function...
   ✅ [TOKEN] Got Agora token from function
   ```
4. **تحقق من localStorage:**
   - `agoraToken` - يجب أن يبدأ بـ "007eJx..."
   - `agoraChannel` - "room-X"
   - `agoraUid` - رقم عشوائي

---

## ⚠️ استكشاف الأخطاء

### خطأ: "Failed to get Agora token"

**الأسباب المحتملة:**
1. `AGORA_PRIMARY_CERTIFICATE` غير موجود في environment variables
2. Netlify Function غير deployed
3. Parameter `channel` مفقود

**الحل:**
```bash
# تحقق من environment variables
cat .env.local | grep AGORA

# يجب أن ترى:
NEXT_PUBLIC_AGORA_APP_ID=...
AGORA_PRIMARY_CERTIFICATE=...
```

### خطأ: Token منتهي الصلاحية

**السبب:** Token صالح لمدة ساعة واحدة فقط

**الحل:**
- اطلب token جديد عند الانضمام مرة أخرى
- أو: عدّل مدة الصلاحية في `agora-token.ts`:
  ```typescript
  const privilegeExpireTime = Math.floor(Date.now() / 1000) + 7200; // ساعتين
  ```

---

## 📚 موارد إضافية

- [Agora Token Documentation](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [agora-token Package](https://www.npmjs.com/package/agora-token)

---

**آخر تحديث:** 2025-11-01
**الإصدار:** 1.0.0
