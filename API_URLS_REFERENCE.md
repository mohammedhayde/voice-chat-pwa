# 📡 مرجع روابط API - Frontend to Backend

**التاريخ:** 2025-11-01
**الحالة:** ✅ محدّث ومُختبر

---

## 🔧 المتغيرات البيئية

### `.env.local`
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5209/api

# ⚠️ ملاحظات:
# - Development: استخدم HTTP port 5209 (أسرع وأسهل)
# - Production: استخدم HTTPS مع domain الخاص بك
# - لا تضع /auth أو /chatrooms في النهاية - الكود يضيفها تلقائياً
```

---

## 📍 روابط API في الكود

### 1. **Authentication Service** (`lib/authService.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
  : 'https://localhost:7065/api/auth';
```

**النتيجة:**
- Development: `http://localhost:5209/api/auth`
- Fallback: `https://localhost:7065/api/auth`

**Endpoints:**
- `POST ${API_BASE_URL}/register` → `http://localhost:5209/api/auth/register`
- `POST ${API_BASE_URL}/login` → `http://localhost:5209/api/auth/login`
- `POST ${API_BASE_URL}/guest-login` → `http://localhost:5209/api/auth/guest-login`
- `POST ${API_BASE_URL}/refresh-token` → `http://localhost:5209/api/auth/refresh-token`
- `POST ${API_BASE_URL}/logout` → `http://localhost:5209/api/auth/logout`
- `POST ${API_BASE_URL}/change-password` → `http://localhost:5209/api/auth/change-password`

---

### 2. **Chat Rooms Service** (`lib/chatRoomsService.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '')
  || 'https://localhost:7065/api';
const CHATROOMS_URL = `${API_BASE_URL}/chatrooms`;
```

**النتيجة:**
- Development: `http://localhost:5209/api/chatrooms`
- Fallback: `https://localhost:7065/api/chatrooms`

**Endpoints:**
- `GET ${CHATROOMS_URL}` → `http://localhost:5209/api/chatrooms`
- `GET ${CHATROOMS_URL}/{id}` → `http://localhost:5209/api/chatrooms/5`
- `POST ${CHATROOMS_URL}` → `http://localhost:5209/api/chatrooms`
- `POST ${CHATROOMS_URL}/{id}/join` → `http://localhost:5209/api/chatrooms/5/join`
- `POST ${CHATROOMS_URL}/{id}/leave` → `http://localhost:5209/api/chatrooms/5/leave`
- `DELETE ${CHATROOMS_URL}/{id}` → `http://localhost:5209/api/chatrooms/5`

**Moderation Endpoints:**
- `POST ${CHATROOMS_URL}/{id}/ban` → `http://localhost:5209/api/chatrooms/5/ban`
- `POST ${CHATROOMS_URL}/{id}/unban` → `http://localhost:5209/api/chatrooms/5/unban`
- `POST ${CHATROOMS_URL}/{id}/mute` → `http://localhost:5209/api/chatrooms/5/mute`
- `POST ${CHATROOMS_URL}/{id}/unmute` → `http://localhost:5209/api/chatrooms/5/unmute`
- `POST ${CHATROOMS_URL}/{id}/remove-member` → `http://localhost:5209/api/chatrooms/5/remove-member`

---

### 3. **SignalR Hub** (`hooks/useSignalR.ts`)

```typescript
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '').replace('/api', '')
  || 'http://localhost:5209');
const SIGNALR_HUB_URL = `${API_BASE_URL}/chatHub`;
```

**النتيجة:**
- Development: `http://localhost:5209/chatHub` ✅
- Fallback: `http://localhost:5209/chatHub`

**⚠️ ملاحظات مهمة:**
- SignalR Hub على **root level** وليس تحت `/api`!
- الحرف `H` في `chatHub` كبير (حساس لحالة الأحرف)!

**SignalR Methods:**
- `JoinRoom(roomId)` - الانضمام للغرفة
- `LeaveRoom(roomId)` - مغادرة الغرفة
- `SendMessage(roomId, content)` - إرسال رسالة
- `BanUser(roomId, userId, reason, isPermanent, expiresAt)` - حظر مستخدم
- `MuteUser(roomId, userId, reason, isPermanent, expiresAt)` - كتم مستخدم
- `KickUser(roomId, userId)` - طرد مستخدم

**SignalR Events:**
- `ReceiveMessage` - رسالة جديدة
- `UserJoined` - مستخدم انضم
- `UserLeft` - مستخدم غادر
- `RoomBanned` - أنت محظور
- `YouWereMuted` - أنت مكتوم
- `UserBanned` - مستخدم تم حظره
- `UserMuted` - مستخدم تم كتمه
- `MessageDeleted` - رسالة محذوفة

---

## 🌐 Backend Server Ports

### Development (Local)

| Protocol | Port | URL | الاستخدام |
|----------|------|-----|-----------|
| **HTTP** | 5209 | `http://localhost:5209` | ✅ الأسرع للتطوير |
| **HTTPS** | 7065 | `https://localhost:7065` | للتطوير مع SSL |

### REST API
- HTTP: `http://localhost:5209/api`
- HTTPS: `https://localhost:7065/api`

### SignalR Hub
- HTTP: `http://localhost:5209/chatHub`
- HTTPS: `https://localhost:7065/chatHub`
- WebSocket: `ws://localhost:5209/chatHub`
- WebSocket Secure: `wss://localhost:7065/chatHub`

---

## 🔐 Authentication

جميع الـ endpoints (ما عدا `/register`, `/login`, `/guest-login`) تحتاج JWT Token:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### SignalR Authentication

```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(SIGNALR_HUB_URL, {
    accessTokenFactory: () => localStorage.getItem('accessToken')
  })
  .build();
```

---

## 🧪 اختبار الاتصال

### 1. اختبار REST API

```bash
# اختبار Guest Login
curl -X POST http://localhost:5209/api/auth/guest-login \
  -H "Content-Type: application/json"

# اختبار الحصول على الغرف
curl http://localhost:5209/api/chatrooms
```

### 2. اختبار SignalR Hub

```bash
# اختبار HTTP (يجب أن يعطي 200)
curl -I http://localhost:5209/chatHub

# اختبار HTTPS (يجب أن يعطي 200)
curl -k -I https://localhost:7065/chatHub
```

---

## 📋 Checklist للتحقق

قبل البدء بالتطوير، تأكد من:

- [x] `.env.local` يحتوي على `NEXT_PUBLIC_API_URL=http://localhost:5209/api`
- [x] Backend ASP.NET Core يعمل على ports 5209 و 7065
- [x] SignalR Hub مُفعّل: `app.MapHub<ChatHub>("/chatHub")`
- [x] CORS مُفعّل لـ `http://localhost:3000` و `http://localhost:3001`
- [x] JWT tokens تعمل بشكل صحيح

---

## 🎯 خلاصة سريعة

| الخدمة | Environment Variable | Frontend Code | Result URL |
|--------|---------------------|---------------|------------|
| **Auth** | `NEXT_PUBLIC_API_URL` | `${API_URL}/auth` | `http://localhost:5209/api/auth` |
| **Chat Rooms** | `NEXT_PUBLIC_API_URL` | `${API_URL}/chatrooms` | `http://localhost:5209/api/chatrooms` |
| **SignalR** | `NEXT_PUBLIC_API_URL` | Strip `/api` + `/chathub` | `http://localhost:5209/chatHub` |

---

## 🚀 Production

عند النشر للـ Production، حدّث `.env.local`:

```env
# Production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api

# مثال:
NEXT_PUBLIC_API_URL=https://api.mychatapp.com/api
```

سيصبح:
- Auth: `https://api.mychatapp.com/api/auth`
- Chat Rooms: `https://api.mychatapp.com/api/chatrooms`
- SignalR: `https://api.mychatapp.com/chatHub`

---

**آخر تحديث:** 2025-11-01
**الحالة:** ✅ جميع الروابط مُحدّثة ومتوافقة مع Backend Documentation
