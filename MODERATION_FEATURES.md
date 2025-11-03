# 🛡️ ميزات الإشراف والإدارة (Moderation Features)

**التاريخ:** 2025-11-01
**الحالة:** ✅ مُطبق ويعمل

---

## 📝 الملخص

تم تطبيق نظام كامل لإدارة وإشراف غرف الدردشة يتضمن:
- صلاحيات متعددة المستويات (Owner/Admin/Member)
- أدوات إدارة (كتم، حظر، طرد)
- واجهة مستخدم للمشرفين
- حماية الرسائل النصية للمستخدمين المكتومين

---

## 🎯 الأدوار والصلاحيات

### الأدوار المتاحة:

| الدور | الوصف | الأيقونة | اللون |
|-------|-------|---------|-------|
| **Owner** | مالك الغرفة - صلاحيات كاملة | 👑 | أصفر |
| **Admin** | مشرف - يمكنه الإدارة | ⭐ | بنفسجي |
| **Member** | عضو عادي | 👤 | رمادي |

### مصفوفة الصلاحيات:

```typescript
interface RoomPermissions {
  isOwner: boolean;        // هل المستخدم مالك الغرفة؟
  isAdmin: boolean;        // هل المستخدم مشرف؟
  isMember: boolean;       // هل المستخدم عضو؟ (دائماً true بعد الانضمام)
  canModerate: boolean;    // هل يمكنه الإدارة؟ (Owner/Admin فقط)
  canSendMessages: boolean; // هل يمكنه إرسال رسائل؟ (false إذا مكتوم)
  role: 'Owner' | 'Admin' | 'Member'; // الدور الفعلي
}
```

**الصلاحيات حسب الدور:**

| العملية | Owner | Admin | Member |
|---------|-------|-------|--------|
| إرسال رسائل | ✅ | ✅ | ✅ (إذا غير مكتوم) |
| الانضمام للصوت | ✅ | ✅ | ✅ |
| مغادرة الغرفة | ❌ | ✅ | ✅ |
| كتم مستخدم | ✅ | ✅ | ❌ |
| طرد مستخدم | ✅ | ✅ | ❌ |
| حظر مستخدم | ✅ | ✅ | ❌ |

---

## 🎨 واجهة المستخدم

### 1. عرض الدور في Sidebar

يظهر دور المستخدم الحالي في أعلى قائمة المتصلين:

```typescript
// في ParticipantsSidebar.tsx
{permissions && (
  <div className={`role-badge ${permissions.role.toLowerCase()}`}>
    {permissions.role === 'Owner' ? '👑 مالك الغرفة' :
     permissions.role === 'Admin' ? '⭐ مشرف' :
     '👤 عضو'}
  </div>
)}
```

**مظهر البطاقة:**
- **Owner:** خلفية صفراء، حدود صفراء، أيقونة تاج 👑
- **Admin:** خلفية بنفسجية، حدود بنفسجية، أيقونة نجمة ⭐
- **Member:** خلفية رمادية، حدود رمادية، أيقونة مستخدم 👤

### 2. أزرار الإدارة للمشرفين

يظهر زر إعدادات (⚙️) بجانب كل مستخدم للمشرفين فقط:

```typescript
{canModerate && !isCurrentUser && (
  <button onClick={() => setShowActionsFor(user.id)}>
    ⚙️
  </button>
)}
```

عند الضغط، تظهر 3 أزرار:

| الزر | الوظيفة | اللون | المدة |
|------|---------|-------|-------|
| 🔇 كتم | منع إرسال رسائل | برتقالي | 60 دقيقة |
| 👋 طرد | إزالة من الغرفة | أصفر | فوري |
| 🚫 حظر | حظر دائم | أحمر | دائم |

### 3. حماية إدخال الرسائل

إذا كان المستخدم مكتوماً:
- يُعطل حقل إدخال النص
- يُعطل زر الإرسال
- يظهر تنبيه: "🔇 تم كتمك من قبل المشرف - لا يمكنك إرسال رسائل"

```typescript
{!canSendMessages && isChatConnected && (
  <p className="text-red-200 animate-pulse">
    🔇 تم كتمك من قبل المشرف - لا يمكنك إرسال رسائل
  </p>
)}
```

---

## 🔧 الكود التقني

### 1. API Functions

جميع دوال الإدارة موجودة في `lib/chatRoomsService.ts`:

#### كتم مستخدم:
```typescript
await muteUser(roomId, {
  userId: 123,
  type: 2, // UserAndIp
  reason: 'كتم من قبل المشرف',
  isPermanent: false,
  durationInMinutes: 60
});
```

#### حظر مستخدم:
```typescript
await banUser(roomId, {
  userId: 123,
  type: 2, // UserAndIp
  reason: 'حظر من قبل المشرف',
  isPermanent: true
});
```

#### طرد مستخدم:
```typescript
await removeMember(roomId, userId);
```

### 2. Component Flow

```
app/page.tsx
  ↓ (joinData.permissions)
VoiceChatRoom
  ↓ (permissions)
ParticipantsSidebar + ChatSection
  ↓
- عرض الدور
- أزرار الإدارة
- حماية الرسائل
```

**التدفق الكامل:**

1. **الانضمام للغرفة:**
   ```typescript
   const response = await joinChatRoomWithToken(roomId);
   // response يحتوي على permissions
   ```

2. **تمرير الصلاحيات:**
   ```typescript
   <VoiceChatRoom
     permissions={joinData.permissions}
     ...
   />
   ```

3. **استخدام الصلاحيات:**
   ```typescript
   // في ParticipantsSidebar
   const canModerate = permissions?.canModerate || false;

   // في ChatSection
   const canSendMessages = permissions?.canSendMessages ?? true;
   ```

### 3. State Management

```typescript
// في ParticipantsSidebar.tsx
const [actionLoading, setActionLoading] = useState<string | null>(null);
const [showActionsFor, setShowActionsFor] = useState<string | null>(null);

// أثناء العملية
setActionLoading('mute'); // أو 'ban' أو 'kick'

// بعد العملية
setActionLoading(null);
setShowActionsFor(null); // إغلاق القائمة
```

---

## 📊 أمثلة الاستخدام

### سيناريو 1: مشرف يكتم مستخدم مزعج

```typescript
// المشرف يضغط على زر الإعدادات بجانب المستخدم
<button onClick={() => setShowActionsFor('user-123')}>⚙️</button>

// تظهر القائمة
<div className="moderation-actions">
  <button onClick={() => handleMuteUser(123)}>🔇 كتم</button>
  <button onClick={() => handleKickUser(123)}>👋 طرد</button>
  <button onClick={() => handleBanUser(123)}>🚫 حظر</button>
</div>

// المشرف يضغط "كتم"
handleMuteUser(123) {
  await muteUser(roomId, {
    userId: 123,
    type: 2,
    reason: 'كتم من قبل المشرف',
    isPermanent: false,
    durationInMinutes: 60
  });
  alert('تم كتم المستخدم لمدة ساعة');
}

// النتيجة:
// 1. المستخدم المكتوم لا يستطيع إرسال رسائل
// 2. يظهر له تنبيه: "تم كتمك من قبل المشرف"
// 3. canSendMessages = false في الـ permissions
```

### سيناريو 2: مالك يحظر مستخدم

```typescript
// المالك يضغط "حظر"
handleBanUser(123) {
  if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;

  await banUser(roomId, {
    userId: 123,
    type: 2, // حظر الحساب والـ IP
    reason: 'حظر من قبل المشرف',
    isPermanent: true
  });
  alert('تم حظر المستخدم بشكل دائم');
}

// النتيجة:
// 1. المستخدم يُطرد فوراً من الغرفة
// 2. لا يستطيع الانضمام مرة أخرى
// 3. حتى لو غيّر IP، الحساب محظور
```

### سيناريو 3: عضو عادي يحاول رؤية أزرار الإدارة

```typescript
// في ParticipantsSidebar
const canModerate = permissions?.canModerate || false; // false

// الأزرار لا تظهر
{canModerate && !isCurrentUser && (
  <button>⚙️</button> // ❌ لا يُعرض
)}
```

---

## 🔒 الأمان

### 1. Validation في Backend

جميع العمليات تتحقق من الصلاحيات في Backend:

```csharp
// في Backend API
if (!userCanModerate) {
  return BadRequest("You don't have permission");
}

if (targetUserId == roomOwnerId) {
  return BadRequest("Cannot ban room owner");
}
```

### 2. Frontend Validation

```typescript
// التحقق من الصلاحيات قبل عرض الأزرار
const canModerate = permissions?.canModerate || false;

if (!canModerate) {
  return null; // لا تعرض أزرار الإدارة
}
```

### 3. API Authentication

جميع الطلبات تتطلب JWT Token:

```typescript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 📡 Integration مع Backend

### Backend Response Example:

عند الانضمام للغرفة، Backend يُرجع:

```json
{
  "success": true,
  "message": "Joined room successfully",
  "agoraToken": "007eJx...",
  "channelName": "room_5",
  "uid": 123,
  "tokenExpiration": 86400,
  "permissions": {
    "isOwner": false,
    "isAdmin": true,
    "isMember": true,
    "canModerate": true,
    "canSendMessages": true,
    "role": "Admin"
  }
}
```

### Frontend يحفظ الصلاحيات:

```typescript
const response = await joinChatRoomWithToken(roomId);

setJoinData({
  success: response.success,
  message: response.message,
  agoraToken: response.agoraToken,
  channelName: response.channelName,
  uid: response.uid,
  tokenExpiration: response.tokenExpiration,
  permissions: response.permissions // ✅ حفظ الصلاحيات
});
```

---

## 🎨 UI/UX Features

### 1. Loading States

أثناء تنفيذ عملية:
```typescript
<button disabled={actionLoading === 'mute'}>
  {actionLoading === 'mute' ? '...' : '🔇 كتم'}
</button>
```

### 2. Confirmation Dialogs

للعمليات الخطيرة:
```typescript
if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;
```

### 3. Success/Error Feedback

```typescript
try {
  await muteUser(...);
  alert('تم كتم المستخدم لمدة ساعة'); // ✅ نجح
} catch (error) {
  alert(`فشل الكتم: ${error.message}`); // ❌ فشل
}
```

### 4. Visual Indicators

- **Disabled Input:** opacity-50 عند الكتم
- **Role Badges:** ألوان مختلفة للأدوار
- **Hover Effects:** تأثيرات عند التمرير على الأزرار

---

## 🐛 استكشاف الأخطاء

### المشكلة: أزرار الإدارة لا تظهر

**السبب:** `permissions.canModerate = false`

**الحل:**
1. تحقق من دور المستخدم في Backend
2. تأكد من أن Backend يُرجع `permissions` في response
3. افحص console logs:
   ```typescript
   console.log('Permissions:', permissions);
   console.log('Can Moderate:', canModerate);
   ```

### المشكلة: لا يمكن إرسال رسائل بعد الكتم

**السبب:** هذا هو السلوك الصحيح! ✅

**التحقق:**
```typescript
console.log('Can Send Messages:', permissions?.canSendMessages);
// Expected: false
```

### المشكلة: خطأ 403 Forbidden عند الكتم/الحظر

**السبب:** Backend يرفض العملية

**الحل:**
1. تحقق من صلاحيات المستخدم في Backend
2. تأكد من أن JWT Token صالح
3. تحقق من أن المستخدم ليس Owner

---

## 📚 ملفات الكود الرئيسية

| الملف | الوظيفة |
|-------|---------|
| `lib/chatRoomsService.ts` | دوال API للإدارة |
| `components/VoiceChatRoom.tsx` | Container الرئيسي |
| `components/chat/ParticipantsSidebar.tsx` | أزرار الإدارة وعرض الأدوار |
| `components/chat/ChatSection.tsx` | حماية الرسائل للمكتومين |

---

## 🚀 الميزات المستقبلية (Optional)

### 1. SignalR Real-time Notifications

```typescript
// الاستماع لإشعارات الكتم
connection.on("UserMuted", (data) => {
  console.log(`User ${data.userId} was muted`);
  // تحديث UI
});

connection.on("YouWereMuted", (data) => {
  alert('تم كتمك من قبل المشرف');
  // تحديث permissions
});
```

### 2. Ban/Mute History

- عرض سجل الحظر/الكتم لكل مستخدم
- معرفة من قام بالحظر ومتى
- مدة الحظر المتبقية

### 3. Advanced Moderation

- **كتم مؤقت متعدد المدد:** 10 دقائق، ساعة، يوم، أسبوع
- **حظر مؤقت:** بدلاً من دائم فقط
- **تحذيرات:** نظام تحذيرات قبل الحظر
- **Appeal System:** السماح للمستخدمين بالاعتراض

### 4. Moderation Logs

```typescript
interface ModerationLog {
  id: number;
  moderatorId: number;
  targetUserId: number;
  action: 'mute' | 'ban' | 'kick';
  reason: string;
  timestamp: string;
}
```

---

## ✅ الخلاصة

تم تطبيق نظام إدارة كامل يشمل:

- ✅ واجهات الصلاحيات (RoomPermissions)
- ✅ دوال API للكتم/الحظر/الطرد
- ✅ واجهة مستخدم للمشرفين في ParticipantsSidebar
- ✅ عرض الأدوار (Owner/Admin/Member)
- ✅ حماية الرسائل للمكتومين
- ✅ تحقق من الصلاحيات في Frontend
- ✅ أزرار إدارة بتصميم جميل
- ✅ Loading states و confirmations

**الحالة:** جاهز للاستخدام! 🎉

---

**آخر تحديث:** 2025-11-01
**الإصدار:** 1.0.0
