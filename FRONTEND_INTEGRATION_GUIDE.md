# 📘 دليل تكامل Frontend مع Backend SignalR - الإصدار 4.0

**التاريخ**: 2025-11-02
**الإصدار**: 4.0
**الحالة**: ✅ جاهز للتطبيق
**Backend Version**: Production Ready

---

## 🎯 المقدمة

مرحباً بك! هذا الدليل يشرح **جميع** التغييرات التي تمت على Backend SignalR والتي تحتاج إلى تطبيقها في Frontend.

### ما الجديد؟
1. ✅ **Kick User** - طرد مستخدم (جديد)
2. ✅ **Unban User** - رفع حظر مستخدم (محسّن)
3. ✅ **SignalR Events** - معلومات أكثر ثراءً
4. ✅ **API Endpoints** - endpoints جديدة ومحسّنة

---

## 📋 جدول المحتويات

1. [API Endpoints الجديدة/المُحسّنة](#1-api-endpoints)
2. [SignalR Events المُحسّنة](#2-signalr-events)
3. [TypeScript Interfaces](#3-typescript-interfaces)
4. [أمثلة كاملة للتطبيق](#4-أمثلة-التطبيق)
5. [خطوات التنفيذ](#5-خطوات-التنفيذ)
6. [Testing & Debugging](#6-testing--debugging)

---

## 1. API Endpoints

### 🆕 1.1. Kick User (جديد)

**Endpoint**: `POST /api/chatrooms/{roomId}/kick`

**الغرض**: طرد مستخدم من الغرفة فوراً (بدون حظر دائم)

**Request**:
```typescript
// Headers
Authorization: Bearer <accessToken>
Content-Type: application/json

// Body
{
  "userId": number,
  "reason": string  // اختياري
}
```

**Response**:
```typescript
// Success (200 OK)
{
  "message": "User kicked successfully"
}

// Error (400 Bad Request)
{
  "message": "Error message here"
}
```

**مثال استخدام**:
```typescript
// في lib/chatRoomsService.ts
export async function kickUser(
  roomId: number,
  userId: number,
  reason?: string
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(
    `${API_BASE_URL}/api/chatrooms/${roomId}/kick`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        reason: reason || 'No reason provided'
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to kick user');
  }
}
```

**SignalR Events المُرسلة**:
- ✅ `UserKicked` → للجميع في الغرفة
- ✅ `RoomKicked` → للمستخدم المطرود
- ✅ `OnlineUsers` → قائمة محدثة (via UpdateOnlineUsers)

---

### ✏️ 1.2. Unban User (محسّن)

**Endpoint**: `DELETE /api/chatrooms/{roomId}/ban/{userId}`

**التغييرات**: Event `UserUnbanned` الآن يحتوي معلومات أكثر!

**Request**:
```typescript
// Headers
Authorization: Bearer <accessToken>

// No body needed
```

**Response**:
```typescript
// Success (200 OK)
{
  "message": "User unbanned successfully"
}
```

**SignalR Event الجديد**:
```typescript
// ❌ BEFORE (قديم - ناقص):
{
  "UserId": number,
  "Timestamp": string
}

// ✅ AFTER (جديد - كامل):
{
  "RoomId": number,          // جديد
  "UserId": number,
  "Username": string,        // جديد
  "UnbannedByUsername": string  // جديد
}
```

---

### ✏️ 1.3. Mute User (محسّن)

**Endpoint**: `POST /api/chatrooms/{roomId}/mute`

**التغييرات**: Events `UserMuted` و `YouWereMuted` محسّنة!

**SignalR Events الجديدة**:

#### A. UserMuted (للجميع في الغرفة)
```typescript
// ❌ BEFORE (قديم):
{
  "UserId": number,
  "MutedUntil": string | null,
  "Timestamp": string
}

// ✅ AFTER (جديد):
{
  "RoomId": number,           // جديد
  "UserId": number,
  "Username": string,         // جديد
  "MutedByUsername": string,  // جديد
  "Reason": string,           // جديد
  "IsPermanent": boolean,     // جديد
  "MutedUntil": string | null
}
```

#### B. YouWereMuted (للمستخدم المكتوم)
```typescript
// ❌ BEFORE (قديم):
{
  "RoomId": number,
  "MutedUntil": string | null
}

// ✅ AFTER (جديد):
{
  "RoomId": number,
  "Reason": string,          // جديد
  "IsPermanent": boolean,    // جديد
  "ExpiresAt": string | null
}
```

---

### ✏️ 1.4. Unmute User (محسّن)

**Endpoint**: `DELETE /api/chatrooms/{roomId}/mute/{userId}`

**SignalR Event الجديد**:

#### UserUnmuted (للجميع في الغرفة)
```typescript
// ❌ BEFORE (قديم):
{
  "UserId": number,
  "Timestamp": string
}

// ✅ AFTER (جديد):
{
  "RoomId": number,            // جديد
  "UserId": number,
  "Username": string,          // جديد
  "UnmutedByUsername": string  // جديد
}
```

---

## 2. SignalR Events

### 📊 ملخص جميع Events المُحسّنة

| Event | التغيير | الأولوية |
|-------|---------|----------|
| **UserMuted** | ✅ إضافة 5 حقول جديدة | 🔴 عالية |
| **YouWereMuted** | ✅ إضافة Reason & IsPermanent | 🟠 متوسطة |
| **UserUnmuted** | ✅ إضافة 3 حقول جديدة | 🔴 عالية |
| **UserKicked** | 🆕 event جديد كلياً | 🔴 عالية |
| **RoomKicked** | 🆕 event جديد كلياً | 🔴 عالية |
| **UserUnbanned** | ✅ إضافة 3 حقول جديدة | 🔴 عالية |

---

### 2.1. UserKicked Event (جديد) 🆕

**متى يُرسل**: عندما يقوم Admin بطرد مستخدم

**يُرسل إلى**: جميع المستخدمين في الغرفة

**البيانات**:
```typescript
interface UserKickedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}
```

**مثال Handler**:
```typescript
// في hooks/useSignalR.ts
newConnection.on('UserKicked', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}) => {
  console.log(`👋 [SIGNALR] ${data.Username} was kicked by ${data.KickedByUsername}`);
  console.log(`   Reason: ${data.Reason}`);

  // يمكن إضافة toast notification
  toast.info(`${data.Username} تم طرده من الغرفة - السبب: ${data.Reason}`);

  // تحديث القائمة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] Failed to refresh after kick:', err.message);
  });
});
```

---

### 2.2. RoomKicked Event (جديد) 🆕

**متى يُرسل**: عندما يتم طردك أنت من الغرفة

**يُرسل إلى**: المستخدم المطرود فقط

**البيانات**:
```typescript
interface RoomKickedEvent {
  RoomId: number;
  Reason: string;
}
```

**مثال Handler**:
```typescript
// في hooks/useSignalR.ts
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

### 2.3. UserMuted Event (محسّن) ✏️

**التغييرات**: إضافة معلومات أكثر ثراءً!

**Handler المُحسّن**:
```typescript
// في hooks/useSignalR.ts
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

  // عرض toast notification مع المعلومات الكاملة
  const duration = data.IsPermanent
    ? 'بشكل دائم'
    : `حتى ${new Date(data.MutedUntil!).toLocaleString('ar-SA')}`;

  toast.warning(
    `${data.Username} تم كتمه بواسطة ${data.MutedByUsername}\n` +
    `السبب: ${data.Reason}\n` +
    `المدة: ${duration}`
  );

  // تحديث القائمة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] Failed to refresh after mute:', err.message);
  });
});
```

---

### 2.4. YouWereMuted Event (محسّن) ✏️

**التغييرات**: إضافة Reason & IsPermanent

**Handler المُحسّن**:
```typescript
// في hooks/useSignalR.ts
newConnection.on('YouWereMuted', (data: {
  RoomId: number;
  Reason: string;
  IsPermanent: boolean;
  ExpiresAt: string | null;
}) => {
  console.log(`🔇 [SIGNALR] You were muted in room ${data.RoomId}`);
  console.log(`   Reason: ${data.Reason}`);

  // عرض رسالة خطأ واضحة للمستخدم
  const duration = data.IsPermanent
    ? 'بشكل دائم'
    : `حتى ${new Date(data.ExpiresAt!).toLocaleString('ar-SA')}`;

  if (onMuted) {
    onMuted(data.Reason, data.ExpiresAt);
  }

  // أو مباشرة:
  setError(
    `🔇 تم كتمك من الغرفة\n` +
    `السبب: ${data.Reason}\n` +
    `المدة: ${duration}`
  );
});
```

---

### 2.5. UserUnmuted Event (محسّن) ✏️

**Handler المُحسّن**:
```typescript
// في hooks/useSignalR.ts
newConnection.on('UserUnmuted', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  UnmutedByUsername: string;
}) => {
  console.log(`🔊 [SIGNALR] ${data.Username} was unmuted by ${data.UnmutedByUsername}`);

  // عرض toast notification
  toast.success(`${data.Username} تم رفع كتمه بواسطة ${data.UnmutedByUsername}`);

  // تحديث القائمة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] Failed to refresh after unmute:', err.message);
  });
});
```

---

### 2.6. UserUnbanned Event (محسّن) ✏️

**Handler المُحسّن**:
```typescript
// في hooks/useSignalR.ts
newConnection.on('UserUnbanned', (data: {
  RoomId: number;
  UserId: number;
  Username: string;
  UnbannedByUsername: string;
}) => {
  console.log(`✅ [SIGNALR] ${data.Username} was unbanned by ${data.UnbannedByUsername}`);

  // عرض toast notification
  toast.success(`${data.Username} تم رفع حظره بواسطة ${data.UnbannedByUsername}`);

  // تحديث القائمة
  newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
    console.warn('⚠️ [SIGNALR] Failed to refresh after unban:', err.message);
  });
});
```

---

## 3. TypeScript Interfaces

### 3.1. Interfaces الجديدة

أضف هذه Interfaces إلى `hooks/useSignalR.ts`:

```typescript
// Event: UserKicked
export interface UserKickedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  KickedByUsername: string;
  Reason: string;
}

// Event: RoomKicked
export interface RoomKickedEvent {
  RoomId: number;
  Reason: string;
}

// Event: UserMuted (محسّن)
export interface UserMutedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  MutedByUsername: string;
  Reason: string;
  IsPermanent: boolean;
  MutedUntil: string | null;
}

// Event: YouWereMuted (محسّن)
export interface YouWereMutedEvent {
  RoomId: number;
  Reason: string;
  IsPermanent: boolean;
  ExpiresAt: string | null;
}

// Event: UserUnmuted (محسّن)
export interface UserUnmutedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  UnmutedByUsername: string;
}

// Event: UserUnbanned (محسّن)
export interface UserUnbannedEvent {
  RoomId: number;
  UserId: number;
  Username: string;
  UnbannedByUsername: string;
}
```

---

### 3.2. تحديث UseSignalRProps

```typescript
export interface UseSignalRProps {
  roomId: number;
  userId: number;
  userName: string;
  onBanned?: (reason: string) => void;
  onMuted?: (reason: string, expiresAt: string | null) => void;
  onUnmuted?: () => void;
  onKicked?: (reason: string) => void;  // جديد (اختياري)
}
```

---

## 4. أمثلة التطبيق

### 4.1. تحديث lib/chatRoomsService.ts

أضف الـ functions الجديدة:

```typescript
// ========================================
// 🆕 Kick User
// ========================================
export async function kickUser(
  roomId: number,
  userId: number,
  reason?: string
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/chatrooms/${roomId}/kick`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        reason: reason || 'No reason provided'
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to kick user');
  }
}

// ========================================
// ✏️ Unban User (محسّن - كان موجود)
// ========================================
export async function unbanUser(
  roomId: number,
  userId: number
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/chatrooms/${roomId}/ban/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unban user');
  }
}
```

---

### 4.2. تحديث hooks/useSignalR.ts

**أضف Event Handlers الجديدة/المحسّنة**:

```typescript
// في useSignalR hook

useEffect(() => {
  // ... existing connection code ...

  // ========================================
  // 🆕 UserKicked Event
  // ========================================
  newConnection.on('UserKicked', (data: UserKickedEvent) => {
    console.log(`👋 [SIGNALR] ${data.Username} was kicked by ${data.KickedByUsername}`);
    console.log(`   Reason: ${data.Reason}`);

    // تحديث القائمة
    newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
      console.warn('⚠️ [SIGNALR] Failed to refresh after kick:', err.message);
    });
  });

  // ========================================
  // 🆕 RoomKicked Event
  // ========================================
  newConnection.on('RoomKicked', (data: RoomKickedEvent) => {
    console.log(`👋 [SIGNALR] You were kicked from room ${data.RoomId}`);
    console.log(`   Reason: ${data.Reason}`);

    // استدعاء callback إذا كان موجود
    if (onKicked) {
      onKicked(data.Reason);
    }

    // أو إعادة توجيه مباشرة
    alert(`تم طردك من الغرفة\nالسبب: ${data.Reason}`);
    router.push('/');
  });

  // ========================================
  // ✏️ UserMuted Event (محسّن)
  // ========================================
  newConnection.on('UserMuted', (data: UserMutedEvent) => {
    console.log(`🔇 [SIGNALR] ${data.Username} was muted by ${data.MutedByUsername}`);
    console.log(`   Reason: ${data.Reason}, Until: ${data.MutedUntil || 'Permanent'}`);

    // تحديث القائمة
    newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
      console.warn('⚠️ [SIGNALR] Failed to refresh after mute:', err.message);
    });
  });

  // ========================================
  // ✏️ YouWereMuted Event (محسّن)
  // ========================================
  newConnection.on('YouWereMuted', (data: YouWereMutedEvent) => {
    console.log(`🔇 [SIGNALR] You were muted in room ${data.RoomId}`);
    console.log(`   Reason: ${data.Reason}`);

    if (onMuted) {
      onMuted(data.Reason, data.ExpiresAt);
    }
  });

  // ========================================
  // ✏️ UserUnmuted Event (محسّن)
  // ========================================
  newConnection.on('UserUnmuted', (data: UserUnmutedEvent) => {
    console.log(`🔊 [SIGNALR] ${data.Username} was unmuted by ${data.UnmutedByUsername}`);

    // تحديث القائمة
    newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
      console.warn('⚠️ [SIGNALR] Failed to refresh after unmute:', err.message);
    });
  });

  // ========================================
  // ✏️ UserUnbanned Event (محسّن)
  // ========================================
  newConnection.on('UserUnbanned', (data: UserUnbannedEvent) => {
    console.log(`✅ [SIGNALR] ${data.Username} was unbanned by ${data.UnbannedByUsername}`);

    // تحديث القائمة
    newConnection.invoke('GetOnlineUsers', data.RoomId).catch(err => {
      console.warn('⚠️ [SIGNALR] Failed to refresh after unban:', err.message);
    });
  });

  // ... rest of the code ...
}, []);
```

---

### 4.3. تحديث UI - ParticipantsSidebar.tsx

**أضف زر Kick في Actions Menu**:

```typescript
// في components/chat/ParticipantsSidebar.tsx

const handleKickUser = async (userId: number) => {
  if (!roomId) return;

  const reason = prompt('سبب الطرد (اختياري):');

  try {
    setActionLoading('kick');
    await kickUser(roomId, userId, reason || undefined);
    alert('تم طرد المستخدم');
    setShowActionsFor(null);
  } catch (error: any) {
    alert(`فشل الطرد: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};

// في Actions Menu JSX:
{canModerate && !isCurrentUser && (
  <div className="space-y-2">
    {/* Existing buttons (Ban, Mute, etc.) */}

    {/* 🆕 Kick Button */}
    <button
      onClick={() => handleKickUser(userId)}
      disabled={actionLoading === 'kick'}
      className="w-full px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-200 transition-colors disabled:opacity-50"
    >
      {actionLoading === 'kick' ? '...' : '👋 طرد'}
    </button>

    {/* 🆕 Unban Button (إذا كان محظور) */}
    {user.isBanned && (
      <button
        onClick={() => handleUnbanUser(userId)}
        disabled={actionLoading === 'unban'}
        className="w-full px-3 py-1.5 text-xs rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-200 transition-colors disabled:opacity-50"
      >
        {actionLoading === 'unban' ? '...' : '✅ رفع الحظر'}
      </button>
    )}
  </div>
)}
```

**Handler لـ Unban**:
```typescript
const handleUnbanUser = async (userId: number) => {
  if (!roomId) return;

  try {
    setActionLoading('unban');
    await unbanUser(roomId, userId);
    alert('تم رفع حظر المستخدم');
    setShowActionsFor(null);
  } catch (error: any) {
    alert(`فشل رفع الحظر: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};
```

---

## 5. خطوات التنفيذ

### المرحلة 1: TypeScript Interfaces (5 دقائق)

```bash
# 1. افتح hooks/useSignalR.ts
# 2. أضف الـ interfaces الجديدة (من القسم 3.1)
# 3. حدّث UseSignalRProps (من القسم 3.2)
```

---

### المرحلة 2: SignalR Event Handlers (15 دقيقة)

```bash
# 1. افتح hooks/useSignalR.ts
# 2. حدّث/أضف Event Handlers (من القسم 4.2):
#    - UserKicked (جديد)
#    - RoomKicked (جديد)
#    - UserMuted (حدّث)
#    - YouWereMuted (حدّث)
#    - UserUnmuted (حدّث)
#    - UserUnbanned (حدّث)
```

---

### المرحلة 3: API Functions (10 دقائق)

```bash
# 1. افتح lib/chatRoomsService.ts
# 2. أضف kickUser function (من القسم 4.1)
# 3. تأكد من وجود unbanUser function (من القسم 4.1)
```

---

### المرحلة 4: UI Updates (15 دقيقة)

```bash
# 1. افتح components/chat/ParticipantsSidebar.tsx
# 2. أضف handleKickUser (من القسم 4.3)
# 3. أضف handleUnbanUser (من القسم 4.3)
# 4. أضف أزرار Kick & Unban في UI (من القسم 4.3)
```

---

### المرحلة 5: Testing (20 دقيقة)

```bash
# 1. Build Frontend
npm run build

# 2. تشغيل Backend
cd BackendChatRoomAPI
dotnet run

# 3. تشغيل Frontend
npm run dev

# 4. اختبار كل وظيفة:
#    ✅ Kick user
#    ✅ Unban user
#    ✅ Mute/Unmute (التحقق من المعلومات الإضافية)
#    ✅ Ban/Unban (التحقق من المعلومات الإضافية)
```

---

## 6. Testing & Debugging

### 6.1. كيفية الاختبار

#### Test 1: Kick User
```typescript
// خطوات:
1. Admin يفتح الغرفة
2. User عادي يدخل الغرفة
3. Admin يضغط "👋 طرد" على User
4. يدخل سبب الطرد (اختياري)

// توقع:
✅ User يُعاد توجيهه للصفحة الرئيسية
✅ User يختفي من قائمة المتصلين عند Admin
✅ Console يعرض: "username was kicked by adminname"
✅ Toast notification تظهر مع السبب
```

#### Test 2: Unban User
```typescript
// خطوات:
1. Admin يحظر User (Ban)
2. User يحاول الدخول - يفشل
3. Admin يضغط "✅ رفع الحظر"
4. User يحاول الدخول مرة أخرى

// توقع:
✅ User يمكنه الدخول للغرفة
✅ Console يعرض: "username was unbanned by adminname"
✅ Toast notification تظهر
```

#### Test 3: Mute مع المعلومات الجديدة
```typescript
// خطوات:
1. Admin يكتم User مع سبب "spam"
2. التحقق من Console

// توقع:
✅ Console يعرض:
   "🔇 username was muted by adminname"
   "Reason: spam, Until: ..."
✅ User المكتوم يرى رسالة: "تم كتمك - السبب: spam"
✅ حقل الإدخال معطّل للـ User المكتوم
```

---

### 6.2. Console Logs المتوقعة

#### عند Kick:
```
👋 [SIGNALR] Ahmed was kicked by ModeratorX
   Reason: spam
🔄 [SIGNALR] Updating online users list for room 1
👥 [SIGNALR] Online users: (4) [...]
```

#### عند Unban:
```
✅ [SIGNALR] Ahmed was unbanned by ModeratorX
🔄 [SIGNALR] Updating online users list for room 1
```

#### عند Mute:
```
🔇 [SIGNALR] Ahmed was muted by ModeratorX
   Reason: spam, Until: 2025-11-02T23:00:00Z
🔄 [SIGNALR] Updating online users list for room 1
```

---

### 6.3. Debugging Tips

#### مشكلة: Event لا يصل
```typescript
// 1. تحقق من Console:
console.log('🔌 [SIGNALR] Connection state:', connection?.state);

// 2. تحقق من Event Registration:
console.log('📋 [SIGNALR] Registered events:',
  Object.keys(connection?._callbacks || {}));

// 3. تحقق من Backend logs
// Backend يجب أن يطبع:
// "🔇 User 123 was muted in room 1 by 456"
```

#### مشكلة: TypeError في Event Data
```typescript
// تأكد من استخدام الـ interface الصحيح:
newConnection.on('UserMuted', (data: UserMutedEvent) => {
  // TypeScript سيحذرك إذا كان هناك خطأ
  console.log(data.RoomId);  // ✅
  console.log(data.Timestamp);  // ❌ لا يوجد Timestamp الآن
});
```

#### مشكلة: API Call فشل
```typescript
// تحقق من Response:
try {
  await kickUser(roomId, userId, reason);
} catch (error) {
  console.error('❌ Kick failed:', error);
  // تحقق من:
  // 1. accessToken موجود؟
  // 2. userId صحيح؟
  // 3. لديك صلاحيات؟
}
```

---

## 7. الملخص السريع

### ما يجب عمله:

| # | المهمة | الملف | الوقت المتوقع |
|---|--------|-------|----------------|
| 1 | إضافة TypeScript Interfaces | `hooks/useSignalR.ts` | 5 دقائق |
| 2 | تحديث Event Handlers | `hooks/useSignalR.ts` | 15 دقيقة |
| 3 | إضافة API Functions | `lib/chatRoomsService.ts` | 10 دقائق |
| 4 | تحديث UI | `components/chat/ParticipantsSidebar.tsx` | 15 دقيقة |
| 5 | Testing | - | 20 دقيقة |
| **إجمالي** | | | **~65 دقيقة** |

---

### الفوائد للمستخدمين:

✅ **Kick** - طرد سريع بدون حظر دائم
✅ **Unban** - رفع حظر بسهولة
✅ **رسائل واضحة** - يعرف الجميع من فعل ماذا ولماذا
✅ **تجربة شفافة** - معلومات كاملة عن كل عملية إدارة

---

## 📞 الدعم

**إذا واجهت مشكلة**:

1. ✅ راجع قسم [Testing & Debugging](#6-testing--debugging)
2. ✅ تحقق من Console logs
3. ✅ تأكد من Backend يعمل (`dotnet run`)
4. ✅ تأكد من Frontend build نجح (`npm run build`)

---

**تاريخ التحديث**: 2025-11-02
**الإصدار**: 4.0
**الحالة**: ✅ **جاهز للتطبيق**

🎉 **بالتوفيق في التطبيق!**
