# 🌐 تكوين روابط API و SignalR

## ✅ الروابط المستخدمة حالياً

### 🔹 Base URL
```
https://backend-chatroom-api.fly.dev
```

### 🔹 API Endpoints

#### Authentication
- **Base**: `https://backend-chatroom-api.fly.dev/api/auth`
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Guest Login: `POST /api/auth/guest-login`
- Logout: `POST /api/auth/logout`
- Refresh Token: `POST /api/auth/refresh-token`
- Change Password: `POST /api/auth/change-password`

#### Chat Rooms
- **Base**: `https://backend-chatroom-api.fly.dev/api/chatrooms`
- Get All Rooms: `GET /api/chatrooms`
- Get Room Details: `GET /api/chatrooms/{roomId}`
- Create Room: `POST /api/chatrooms`
- Join Room: `POST /api/chatrooms/{roomId}/join`
- Leave Room: `POST /api/chatrooms/{roomId}/leave`
- Get Room Settings: `GET /api/chatrooms/{roomId}/settings`
- Update Room Settings: `PUT /api/chatrooms/{roomId}/settings`
- Get Membership History: `GET /api/chatrooms/{roomId}/membership-history`
- Get Banned Users: `GET /api/chatrooms/{roomId}/banned`

#### Moderation
- Ban User: `POST /api/chatrooms/{roomId}/ban`
- Unban User: `DELETE /api/chatrooms/{roomId}/unban/{userId}`
- Mute User: `POST /api/chatrooms/{roomId}/mute`
- Unmute User: `DELETE /api/chatrooms/{roomId}/mute/{userId}`
- Kick User: `DELETE /api/chatrooms/{roomId}/members/{userId}`
- Ban by IP History: `POST /api/chatrooms/{roomId}/ban-by-ip-history`

#### Room Management (Owner Only)
- Promote to Admin: `POST /api/chatrooms/{roomId}/promote-admin`
- Demote from Admin: `POST /api/chatrooms/{roomId}/demote-admin`
- Transfer Ownership: `POST /api/chatrooms/{roomId}/transfer-ownership`

### 🔹 SignalR Hub
```
https://backend-chatroom-api.fly.dev/chatHub
```

**WebSocket URL**:
```
wss://backend-chatroom-api.fly.dev/chatHub
```

## 📁 ملفات التكوين

### `.env.local`
```bash
NEXT_PUBLIC_API_URL=https://backend-chatroom-api.fly.dev/api
```

### `lib/authService.ts`
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
  : 'https://backend-chatroom-api.fly.dev/api/auth';
```

### `lib/chatRoomsService.ts`
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '')
  || 'https://backend-chatroom-api.fly.dev/api';
const CHATROOMS_URL = `${API_BASE_URL}/chatrooms`;
```

### `hooks/useSignalR.ts`
```typescript
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '').replace('/api', '')
  || 'https://backend-chatroom-api.fly.dev');
const SIGNALR_HUB_URL = `${API_BASE_URL}/chatHub`;
```

## 🔄 SignalR Events

### Client → Server (Invoke)
- `JoinRoom(roomId, userId)` - الانضمام لغرفة
- `LeaveRoom(roomId, userId)` - مغادرة غرفة
- `SendMessage(roomId, userId, message)` - إرسال رسالة
- `GetOnlineUsers(roomId)` - الحصول على قائمة المتصلين

### Server → Client (On)
- `ReceiveMessage` - رسالة جديدة
- `OnlineUsers` - قائمة المتصلين
- `UserJoined` - مستخدم انضم
- `UserLeft` - مستخدم غادر
- `UserOnline` - مستخدم متصل
- `UserOffline` - مستخدم غير متصل
- `RoomBanned` - تم حظرك من الغرفة
- `RoomKicked` - تم طردك من الغرفة
- `YouWereMuted` - تم كتمك
- `YouWereUnmuted` - تم رفع كتمك
- `UserBanned` - مستخدم تم حظره
- `UserKicked` - مستخدم تم طرده
- `UserMuted` - مستخدم تم كتمه
- `UserUnmuted` - مستخدم تم رفع كتمه
- `UserUnbanned` - مستخدم تم رفع حظره
- `UpdateOnlineUsers` - تحديث قائمة المتصلين
- `RoomSettingsUpdated` - تحديث إعدادات الغرفة
- `UserBannedByIpHistory` - حظر بسجل IP
- `MessageDeleted` - رسالة محذوفة

## 🔐 Authentication

جميع الطلبات (ما عدا Login/Register/GuestLogin) تحتاج إلى:
```
Authorization: Bearer {accessToken}
```

يتم حفظ `accessToken` و `refreshToken` في `localStorage`:
- `localStorage.getItem('accessToken')`
- `localStorage.getItem('refreshToken')`

## 📊 Health Check
```
GET https://backend-chatroom-api.fly.dev/health
```

## 📚 Swagger Documentation
```
https://backend-chatroom-api.fly.dev/swagger
```

## ✅ تم التحديث

- ✅ إزالة port `:7065` من جميع الروابط
- ✅ تحديث `.env.local`
- ✅ تحديث `chatRoomsService.ts` fallback URL
- ✅ جميع الخدمات تستخدم الروابط الصحيحة
- ✅ البناء نجح بدون أخطاء

---

**تاريخ التحديث**: $(date)
