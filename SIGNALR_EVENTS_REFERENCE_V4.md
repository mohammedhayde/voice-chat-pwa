# 📡 SignalR Events Reference - الإصدار 4.0

**التاريخ**: 2025-11-02
**Backend Version**: 4.0 Production Ready
**الحالة**: ✅ مرجع شامل لجميع SignalR Events

---

## 📋 جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [جميع Events المتاحة](#2-جميع-events-المتاحة)
3. [Events التفصيلية](#3-events-التفصيلية)
4. [TypeScript Interfaces](#4-typescript-interfaces)
5. [أمثلة كاملة للتطبيق](#5-أمثلة-كاملة-للتطبيق)
6. [Flow Diagrams](#6-flow-diagrams)

---

## 1. نظرة عامة

### ما هو SignalR؟
SignalR هو مكتبة من Microsoft للاتصال real-time بين Server و Clients.

### كيف يعمل في هذا المشروع؟
```
Backend (ASP.NET Core)
    ↓ SignalR Hub
    ↓ WebSocket Connection
    ↓
Frontend (@microsoft/signalr)
```

### Event Types

| النوع | الوصف | مثال |
|-------|-------|------|
| **Server → All** | يُرسل لجميع المستخدمين | `UserJoined`, `UserMuted` |
| **Server → User** | يُرسل لمستخدم محدد | `YouWereMuted`, `RoomKicked` |
| **Client → Server** | المستخدم يستدعي method | `JoinRoom`, `SendMessage` |

---

## 2. جميع Events المتاحة

### 📊 ملخص شامل

| # | Event Name | النوع | التحديث | الحقول |
|---|-----------|-------|---------|--------|
| 1 | **ReceiveMessage** | Server → All | - | 4 |
| 2 | **OnlineUsers** | Server → Caller | - | Array |
| 3 | **UserJoined** | Server → All | - | 3 |
| 4 | **UserLeft** | Server → All | - | 3 |
| 5 | **UserOnline** | Server → All | - | 1 |
| 6 | **UserOffline** | Server → All | - | 1 |
| 7 | **UserMuted** | Server → All | ✅ v4.0 | 7 |
| 8 | **YouWereMuted** | Server → User | ✅ v4.0 | 4 |
| 9 | **UserUnmuted** | Server → All | ✅ v4.0 | 4 |
| 10 | **YouWereUnmuted** | Server → User | - | 1 |
| 11 | **UserBanned** | Server → All | - | 7 |
| 12 | **RoomBanned** | Server → User | - | 4 |
| 13 | **UserUnbanned** | Server → All | ✅ v4.0 | 4 |
| 14 | **RoomUnbanned** | Server → User | - | 1 |
| 15 | **UserKicked** | Server → All | 🆕 v4.0 | 5 |
| 16 | **RoomKicked** | Server → User | 🆕 v4.0 | 2 |
| 17 | **UpdateOnlineUsers** | Server → All | - | 1 |
| 18 | **MessageDeleted** | Server → All | - | 2 |

**إجمالي**: 18 event

**جديد في v4.0**:
- 🆕 UserKicked
- 🆕 RoomKicked
- ✅ UserMuted (محسّن)
- ✅ YouWereMuted (محسّن)
- ✅ UserUnmuted (محسّن)
- ✅ UserUnbanned (محسّن)

---

## 3. Events التفصيلية

### 📨 3.1. ReceiveMessage

**الوصف**: رسالة جديدة في الـ chat

**متى يُرسل**: عندما يرسل أي مستخدم رسالة

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  userId: number;
  username: string;
  message: string;
  sentAt: string;  // ISO 8601 format
}
```

**مثال**:
```typescript
newConnection.on('ReceiveMessage', (data: {
  userId: number;
  username: string;
  message: string;
  sentAt: string;
}) => {
  console.log(`💬 [SIGNALR] ${data.username}: ${data.message}`);

  // إضافة الرسالة للقائمة
  setMessages(prev => [...prev, {
    id: ++messageIdCounter.current,
    chatRoomId: roomId,
    userId: data.userId,
    username: data.username,
    content: data.message,
    sentAt: data.sentAt,
    isLocal: data.username === userName
  }]);
});
```

---

### 👥 3.2. OnlineUsers

**الوصف**: قائمة المستخدمين المتصلين في الغرفة

**متى يُرسل**:
- عند استدعاء `GetOnlineUsers`
- بعد `UpdateOnlineUsers` event

**يُرسل إلى**: المستخدم الذي طلب (Caller)

**البيانات**:
```typescript
Array<{
  // Basic Info
  userId: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;  // "User" | "Admin" | "SuperAdmin"

  // Room Permissions
  isRoomAdmin: boolean;
  isRoomOwner: boolean;

  // Mute Status
  isMuted: boolean;
  mutedUntil: string | null;
  muteReason: string | null;

  // Ban/Suspension Status
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;

  // Connection Info
  lastSeenAt: string;
  isOnline: boolean;
  connectionCount: number;
}>
```

**مثال**:
```typescript
newConnection.on('OnlineUsers', (users: ConnectedUser[]) => {
  console.log(`👥 [SIGNALR] Online users:`, users);
  setConnectedUsers(users);
});
```

---

### 👋 3.3. UserJoined

**الوصف**: مستخدم جديد انضم للغرفة

**متى يُرسل**: عندما ينضم مستخدم للغرفة

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  UserId: number;
  Username: string;
  JoinedAt: string;  // ISO 8601
}
```

**مثال**:
```typescript
newConnection.on('UserJoined', (data: {
  UserId: number;
  Username: string;
  JoinedAt: string;
}) => {
  console.log(`👋 [SIGNALR] ${data.Username} joined room`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 👋 3.4. UserLeft

**الوصف**: مستخدم غادر الغرفة

**متى يُرسل**: عندما يغادر مستخدم الغرفة

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  UserId: number;
  Username: string;
  LeftAt: string;  // ISO 8601
}
```

**مثال**:
```typescript
newConnection.on('UserLeft', (data: {
  UserId: number;
  Username: string;
  LeftAt: string;
}) => {
  console.log(`👋 [SIGNALR] ${data.Username} left room`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### ✅ 3.5. UserOnline

**الوصف**: مستخدم أصبح online (أول اتصال له)

**متى يُرسل**: عند أول اتصال للمستخدم (من أي جهاز)

**يُرسل إلى**: جميع المستخدمين

**البيانات**:
```typescript
userId: number
```

**مثال**:
```typescript
newConnection.on('UserOnline', (userId: number) => {
  console.log(`✅ [SIGNALR] User ${userId} came online`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', roomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 📴 3.6. UserOffline

**الوصف**: مستخدم أصبح offline (آخر اتصال له انقطع)

**متى يُرسل**: عندما تنقطع جميع اتصالات المستخدم

**يُرسل إلى**: جميع المستخدمين

**البيانات**:
```typescript
userId: number
```

**مثال**:
```typescript
newConnection.on('UserOffline', (userId: number) => {
  console.log(`📴 [SIGNALR] User ${userId} went offline`);

  // إزالة من القائمة
  setConnectedUsers(prev => prev.filter(u => u.userId !== userId));
});
```

---

### 🔇 3.7. UserMuted ✅ (محسّن في v4.0)

**الوصف**: مستخدم تم كتمه

**متى يُرسل**: عندما يقوم Admin بكتم مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**التغييرات في v4.0**:
```typescript
// ❌ BEFORE (v3.x):
{
  UserId: number;
  MutedUntil: string | null;
  Timestamp: string;
}

// ✅ AFTER (v4.0):
{
  RoomId: number;           // جديد
  UserId: number;
  Username: string;         // جديد
  MutedByUsername: string;  // جديد
  Reason: string;           // جديد
  IsPermanent: boolean;     // جديد
  MutedUntil: string | null;
}
```

**مثال**:
```typescript
newConnection.on('UserMuted', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  MutedByUsername: string;
  Reason: string;
  IsPermanent: boolean;
  MutedUntil: string | null;
}) => {
  console.log(`🔇 [SIGNALR] ${data.Username} was muted by ${data.MutedByUsername}`);
  console.log(`   Reason: ${data.Reason}`);
  console.log(`   Until: ${data.MutedUntil || 'Permanent'}`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 🔇 3.8. YouWereMuted ✅ (محسّن في v4.0)

**الوصف**: أنت تم كتمك

**متى يُرسل**: عندما يتم كتمك

**يُرسل إلى**: المستخدم المكتوم فقط

**التغييرات في v4.0**:
```typescript
// ❌ BEFORE (v3.x):
{
  RoomId: number;
  MutedUntil: string | null;
}

// ✅ AFTER (v4.0):
{
  RoomId: number;
  Reason: string;        // جديد
  IsPermanent: boolean;  // جديد
  ExpiresAt: string | null;
}
```

**مثال**:
```typescript
newConnection.on('YouWereMuted', (data: {
  RoomId: number;
  Reason: string;
  IsPermanent: boolean;
  ExpiresAt: string | null;
}) => {
  console.log(`🔇 [SIGNALR] You were muted in room ${data.RoomId}`);
  console.log(`   Reason: ${data.Reason}`);

  const duration = data.IsPermanent
    ? 'دائماً'
    : `حتى ${new Date(data.ExpiresAt!).toLocaleString('ar-SA')}`;

  if (onMuted) {
    onMuted(data.Reason, data.ExpiresAt);
  }

  // أو:
  setError(`🔇 تم كتمك - السبب: ${data.Reason} - المدة: ${duration}`);
});
```

---

### 🔊 3.9. UserUnmuted ✅ (محسّن في v4.0)

**الوصف**: مستخدم تم رفع كتمه

**متى يُرسل**: عندما يقوم Admin برفع كتم مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**التغييرات في v4.0**:
```typescript
// ❌ BEFORE (v3.x):
{
  UserId: number;
  Timestamp: string;
}

// ✅ AFTER (v4.0):
{
  RoomId: number;             // جديد
  UserId: number;
  Username: string;           // جديد
  UnmutedByUsername: string;  // جديد
}
```

**مثال**:
```typescript
newConnection.on('UserUnmuted', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  UnmutedByUsername: string;
}) => {
  console.log(`🔊 [SIGNALR] ${data.Username} was unmuted by ${data.UnmutedByUsername}`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 🔊 3.10. YouWereUnmuted

**الوصف**: أنت تم رفع كتمك

**متى يُرسل**: عندما يتم رفع كتمك

**يُرسل إلى**: المستخدم الذي تم رفع كتمه فقط

**البيانات**:
```typescript
{
  RoomId: number;
}
```

**مثال**:
```typescript
newConnection.on('YouWereUnmuted', (data: { RoomId: number }) => {
  console.log(`🔊 [SIGNALR] You were unmuted in room ${data.RoomId}`);

  if (onUnmuted) {
    onUnmuted();
  }

  // أو:
  setError('');  // مسح رسالة الخطأ
});
```

---

### 🚫 3.11. UserBanned

**الوصف**: مستخدم تم حظره

**متى يُرسل**: عندما يقوم Admin بحظر مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  roomId: number;
  userId: number;
  username: string;
  bannedByUsername: string;
  reason: string;
  isPermanent: boolean;
  expiresAt: string | null;
}
```

**مثال**:
```typescript
newConnection.on('UserBanned', (
  roomId: number,
  userId: number,
  username: string,
  bannedByUsername: string,
  reason: string,
  isPermanent: boolean,
  expiresAt: string | null
) => {
  console.log(`🚫 [SIGNALR] ${username} was banned by ${bannedByUsername}`);

  // إزالة من القائمة
  setConnectedUsers(prev => prev.filter(u => u.userId !== userId));
});
```

---

### 🚫 3.12. RoomBanned

**الوصف**: أنت تم حظرك من الغرفة

**متى يُرسل**: عندما يتم حظرك

**يُرسل إلى**: المستخدم المحظور فقط

**البيانات**:
```typescript
{
  roomId: number;
  reason: string;
  isPermanent: boolean;
  expiresAt: string | null;
}
```

**مثال**:
```typescript
newConnection.on('RoomBanned', (
  roomId: number,
  reason: string,
  isPermanent: boolean,
  expiresAt: string | null
) => {
  console.log(`🚫 [SIGNALR] You were banned from room ${roomId}`);

  if (onBanned) {
    onBanned(reason);
  }

  // أو:
  alert(`🚫 تم حظرك من الغرفة\nالسبب: ${reason}`);
  router.push('/');
});
```

---

### ✅ 3.13. UserUnbanned ✅ (محسّن في v4.0)

**الوصف**: مستخدم تم رفع حظره

**متى يُرسل**: عندما يقوم Admin برفع حظر مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**التغييرات في v4.0**:
```typescript
// ❌ BEFORE (v3.x):
{
  UserId: number;
  Timestamp: string;
}

// ✅ AFTER (v4.0):
{
  RoomId: number;              // جديد
  UserId: number;
  Username: string;            // جديد
  UnbannedByUsername: string;  // جديد
}
```

**مثال**:
```typescript
newConnection.on('UserUnbanned', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  UnbannedByUsername: string;
}) => {
  console.log(`✅ [SIGNALR] ${data.Username} was unbanned by ${data.UnbannedByUsername}`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### ✅ 3.14. RoomUnbanned

**الوصف**: أنت تم رفع حظرك من الغرفة

**متى يُرسل**: عندما يتم رفع حظرك

**يُرسل إلى**: المستخدم الذي تم رفع حظره فقط

**البيانات**:
```typescript
{
  RoomId: number;
}
```

**مثال**:
```typescript
newConnection.on('RoomUnbanned', (data: { RoomId: number }) => {
  console.log(`✅ [SIGNALR] You were unbanned from room ${data.RoomId}`);

  // إشعار المستخدم
  alert('✅ تم رفع حظرك! يمكنك الآن الدخول للغرفة');
});
```

---

### 👋 3.15. UserKicked 🆕 (جديد في v4.0)

**الوصف**: مستخدم تم طرده من الغرفة

**متى يُرسل**: عندما يقوم Admin بطرد مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}
```

**مثال**:
```typescript
newConnection.on('UserKicked', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}) => {
  console.log(`👋 [SIGNALR] ${data.Username} was kicked by ${data.KickedByUsername}`);
  console.log(`   Reason: ${data.Reason}`);

  // عرض toast notification
  toast.info(`${data.Username} تم طرده - السبب: ${data.Reason}`);

  // طلب قائمة محدثة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 👋 3.16. RoomKicked 🆕 (جديد في v4.0)

**الوصف**: أنت تم طردك من الغرفة

**متى يُرسل**: عندما يتم طردك

**يُرسل إلى**: المستخدم المطرود فقط

**البيانات**:
```typescript
{
  RoomId: number;
  Reason: string;
}
```

**مثال**:
```typescript
newConnection.on('RoomKicked', (data: {
  RoomId: number;
  Reason: string;
}) => {
  console.log(`👋 [SIGNALR] You were kicked from room ${data.RoomId}`);
  console.log(`   Reason: ${data.Reason}`);

  // إعادة توجيه للصفحة الرئيسية
  alert(`تم طردك من الغرفة\nالسبب: ${data.Reason}`);
  router.push('/');
});
```

---

### 🔄 3.17. UpdateOnlineUsers

**الوصف**: تحديث قائمة المتصلين

**متى يُرسل**: بعد أي عملية إدارة (Mute, Unmute, Kick, Ban, Unban)

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  RoomId: number;
}
```

**مثال**:
```typescript
newConnection.on('UpdateOnlineUsers', (data: { RoomId: number }) => {
  console.log(`🔄 [SIGNALR] Updating online users list for room ${data.RoomId}`);

  // طلب القائمة المحدثة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] GetOnlineUsers failed:', err.message);
  });
});
```

---

### 🗑️ 3.18. MessageDeleted

**الوصف**: رسالة تم حذفها

**متى يُرسل**: عندما يحذف Admin/User رسالة

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
{
  messageId: number;
  roomId: number;
}
```

**مثال**:
```typescript
newConnection.on('MessageDeleted', (messageId: number, roomId: number) => {
  console.log(`🗑️ [SIGNALR] Message ${messageId} was deleted`);

  // إزالة الرسالة من القائمة
  setMessages(prev => prev.filter(m => m.id !== messageId));
});
```

---

## 4. TypeScript Interfaces

### جميع Interfaces المطلوبة

```typescript
// ========================================
// Event Interfaces
// ========================================

// ReceiveMessage
export interface ReceiveMessageEvent {
  userId: number;
  username: string;
  message: string;
  sentAt: string;
}

// UserJoined
export interface UserJoinedEvent {
  UserId: number;
  Username: string;
  JoinedAt: string;
}

// UserLeft
export interface UserLeftEvent {
  UserId: number;
  Username: string;
  LeftAt: string;
}

// UserMuted (v4.0)
export interface UserMutedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  MutedByUsername: string;
  Reason: string;
  IsPermanent: boolean;
  MutedUntil: string | null;
}

// YouWereMuted (v4.0)
export interface YouWereMutedEvent {
  RoomId: number;
  Reason: string;
  IsPermanent: boolean;
  ExpiresAt: string | null;
}

// UserUnmuted (v4.0)
export interface UserUnmutedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  UnmutedByUsername: string;
}

// YouWereUnmuted
export interface YouWereUnmutedEvent {
  RoomId: number;
}

// UserKicked (v4.0 - NEW)
export interface UserKickedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}

// RoomKicked (v4.0 - NEW)
export interface RoomKickedEvent {
  RoomId: number;
  Reason: string;
}

// UserUnbanned (v4.0)
export interface UserUnbannedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  UnbannedByUsername: string;
}

// RoomUnbanned
export interface RoomUnbannedEvent {
  RoomId: number;
}

// UpdateOnlineUsers
export interface UpdateOnlineUsersEvent {
  RoomId: number;
}

// ConnectedUser (from GetOnlineUsers)
export interface ConnectedUser {
  // Basic user info
  userId: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;

  // Room permissions
  isRoomAdmin: boolean;
  isRoomOwner: boolean;

  // Mute status
  isMuted: boolean;
  mutedUntil: string | null;
  muteReason: string | null;

  // Ban status
  isBanned: boolean;

  // Suspension status
  isSuspended: boolean;
  suspendedUntil: string | null;

  // Connection info
  lastSeenAt: string;
  isOnline: boolean;
  connectionCount: number;
}
```

---

## 5. أمثلة كاملة للتطبيق

### مثال 1: تسجيل جميع Events

```typescript
// في hooks/useSignalR.ts
import * as signalR from '@microsoft/signalr';

export const useSignalR = ({ roomId, userId, userName }: UseSignalRProps) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .build();

    // ========================================
    // تسجيل جميع Events
    // ========================================

    // Messages
    newConnection.on('ReceiveMessage', (data: ReceiveMessageEvent) => {
      console.log(`💬 [SIGNALR] ${data.username}: ${data.message}`);
      // Handle message...
    });

    // Users Join/Leave
    newConnection.on('UserJoined', (data: UserJoinedEvent) => {
      console.log(`👋 [SIGNALR] ${data.Username} joined`);
      newConnection.invoke('GetOnlineUsers', roomId);
    });

    newConnection.on('UserLeft', (data: UserLeftEvent) => {
      console.log(`👋 [SIGNALR] ${data.Username} left`);
      newConnection.invoke('GetOnlineUsers', roomId);
    });

    // Mute Events
    newConnection.on('UserMuted', (data: UserMutedEvent) => {
      console.log(`🔇 [SIGNALR] ${data.Username} muted by ${data.MutedByUsername}`);
      newConnection.invoke('GetOnlineUsers', data.RoomId);
    });

    newConnection.on('YouWereMuted', (data: YouWereMutedEvent) => {
      console.log(`🔇 [SIGNALR] You were muted: ${data.Reason}`);
      // Handle mute...
    });

    newConnection.on('UserUnmuted', (data: UserUnmutedEvent) => {
      console.log(`🔊 [SIGNALR] ${data.Username} unmuted`);
      newConnection.invoke('GetOnlineUsers', data.RoomId);
    });

    // Kick Events (NEW in v4.0)
    newConnection.on('UserKicked', (data: UserKickedEvent) => {
      console.log(`👋 [SIGNALR] ${data.Username} kicked`);
      newConnection.invoke('GetOnlineUsers', data.RoomId);
    });

    newConnection.on('RoomKicked', (data: RoomKickedEvent) => {
      alert(`Kicked: ${data.Reason}`);
      router.push('/');
    });

    // Unban Events
    newConnection.on('UserUnbanned', (data: UserUnbannedEvent) => {
      console.log(`✅ [SIGNALR] ${data.Username} unbanned`);
      newConnection.invoke('GetOnlineUsers', data.RoomId);
    });

    // Online Users
    newConnection.on('OnlineUsers', (users: ConnectedUser[]) => {
      console.log(`👥 [SIGNALR] ${users.length} users online`);
      setConnectedUsers(users);
    });

    // Update Trigger
    newConnection.on('UpdateOnlineUsers', (data: UpdateOnlineUsersEvent) => {
      newConnection.invoke('GetOnlineUsers', data.RoomId);
    });

    // Start connection
    newConnection.start()
      .then(() => {
        console.log('✅ [SIGNALR] Connected');
        return newConnection.invoke('JoinRoom', roomId, userId);
      })
      .then(() => {
        setConnection(newConnection);
      });

    return () => {
      newConnection.stop();
    };
  }, []);

  return { connection, /* ... */ };
};
```

---

## 6. Flow Diagrams

### Flow 1: Mute User

```
Admin يكتم User
    ↓
Backend يُنفذ MuteUser
    ↓
Backend يرسل 3 events:
    ├─→ UserMuted (All in room)
    │   └─→ Frontend يعرض toast
    │       Frontend يطلب GetOnlineUsers
    │
    ├─→ YouWereMuted (Muted user only)
    │   └─→ Frontend يعطّل chat input
    │       Frontend يعرض رسالة خطأ
    │
    └─→ UpdateOnlineUsers (All in room)
        └─→ Frontend يطلب GetOnlineUsers
            Frontend يستقبل OnlineUsers
            UI يتحدث (badge "مكتوم" يظهر)
```

### Flow 2: Kick User

```
Admin يطرد User
    ↓
Backend يُنفذ KickUser
    ↓
Backend يرسل 3 events:
    ├─→ UserKicked (All in room)
    │   └─→ Frontend يعرض toast
    │       Frontend يطلب GetOnlineUsers
    │
    ├─→ RoomKicked (Kicked user only)
    │   └─→ Frontend يعرض alert
    │       router.push('/')
    │
    └─→ UpdateOnlineUsers (All in room)
        └─→ Frontend يطلب GetOnlineUsers
            Frontend يستقبل OnlineUsers
            UI يتحدث (user يختفي من القائمة)
```

### Flow 3: Unban User

```
Admin يرفع حظر User
    ↓
Backend يُنفذ UnbanUser
    ↓
Backend يرسل 3 events:
    ├─→ UserUnbanned (All in room)
    │   └─→ Frontend يعرض toast
    │       Frontend يطلب GetOnlineUsers
    │
    ├─→ RoomUnbanned (Unbanned user only)
    │   └─→ Frontend يعرض alert
    │       User يمكنه الدخول الآن
    │
    └─→ UpdateOnlineUsers (All in room)
        └─→ Frontend يطلب GetOnlineUsers
            Frontend يستقبل OnlineUsers
            UI يتحدث
```

---

## 📊 ملخص التغييرات في v4.0

| Event | التغيير | الحقول المضافة |
|-------|---------|----------------|
| **UserMuted** | ✅ محسّن | +5: RoomId, Username, MutedByUsername, Reason, IsPermanent |
| **YouWereMuted** | ✅ محسّن | +2: Reason, IsPermanent |
| **UserUnmuted** | ✅ محسّن | +3: RoomId, Username, UnmutedByUsername |
| **UserUnbanned** | ✅ محسّن | +3: RoomId, Username, UnbannedByUsername |
| **UserKicked** | 🆕 جديد | 5 حقول |
| **RoomKicked** | 🆕 جديد | 2 حقول |

**إجمالي الحقول الجديدة**: 20 حقل

---

**تاريخ التحديث**: 2025-11-02
**الإصدار**: 4.0
**الحالة**: ✅ **مرجع نهائي**

🎉 **مرجع شامل لجميع SignalR Events!**
