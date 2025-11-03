# 🛡️ دليل استخدام وظائف الإدارة (Moderation)

## نظرة عامة

هذا الدليل يشرح كيفية استخدام وظائف الإدارة (الحظر، الكتم، الطرد) في التطبيق.

---

## ✅ الوظائف المتاحة

التطبيق يدعم جميع وظائف الإدارة الموثقة في Backend:

- ✅ **حظر مستخدم (Ban)** - منع المستخدم من الدخول للغرفة
- ✅ **رفع الحظر (Unban)** - السماح للمستخدم بالدخول مرة أخرى
- ✅ **كتم مستخدم (Mute)** - منع المستخدم من إرسال رسائل
- ✅ **رفع الكتم (Unmute)** - السماح للمستخدم بإرسال رسائل
- ✅ **طرد مستخدم (Kick)** - طرد المستخدم من الغرفة (يمكنه الدخول مرة أخرى)

---

## 📂 ملفات الكود ذات الصلة

### 1. `lib/chatRoomsService.ts`
يحتوي على جميع وظائف الـ API:
- `banUser(roomId, data)` - حظر مستخدم
- `unbanUser(roomId, userId)` - رفع الحظر
- `muteUser(roomId, data)` - كتم مستخدم
- `unmuteUser(roomId, userId)` - رفع الكتم
- `removeMember(roomId, userId)` - إزالة عضو

### 2. `hooks/useSignalR.ts`
يحتوي على معالجات SignalR events:
- `RoomBanned` - يتلقى المستخدم عند حظره
- `YouWereMuted` - يتلقى المستخدم عند كتمه
- `UserBanned` - يتلقى الجميع عند حظر مستخدم
- `UserMuted` - يتلقى الجميع عند كتم مستخدم
- `MessageDeleted` - عند حذف رسالة

### 3. `components/chat/ParticipantsSidebar.tsx`
يحتوي على واجهة المستخدم لأدوات الإدارة:
- أزرار الإدارة للمشرفين
- قائمة الإجراءات (حظر، كتم، طرد)

---

## 🎯 كيفية الاستخدام

### 1️⃣ حظر مستخدم (Ban)

```typescript
import { banUser } from '@/lib/chatRoomsService';

async function handleBan() {
  try {
    await banUser(roomId, {
      userId: 21,
      type: 2, // UserAndIp
      reason: 'Spamming',
      isPermanent: false,
      durationInMinutes: 1440 // 24 hours
    });

    alert('✅ تم حظر المستخدم بنجاح');
  } catch (error) {
    alert(`❌ فشل الحظر: ${error.message}`);
  }
}
```

**الواجهة في ParticipantsSidebar:**
- الزر: "🚫 حظر" (موجود في قائمة الإجراءات)
- الدالة: `handleBanUser(userId)`

---

### 2️⃣ رفع الحظر (Unban)

```typescript
import { unbanUser } from '@/lib/chatRoomsService';

async function handleUnban() {
  try {
    await unbanUser(roomId, userId);
    alert('✅ تم رفع الحظر بنجاح');
  } catch (error) {
    alert(`❌ فشل رفع الحظر: ${error.message}`);
  }
}
```

**الواجهة في ParticipantsSidebar:**
- الزر: "✅ رفع الحظر"
- الدالة: `handleUnbanUser(userId)`

---

### 3️⃣ كتم مستخدم (Mute)

```typescript
import { muteUser } from '@/lib/chatRoomsService';

async function handleMute() {
  try {
    await muteUser(roomId, {
      userId: 21,
      type: 2, // UserAndIp
      reason: 'Breaking chat rules',
      isPermanent: false,
      durationInMinutes: 60 // 1 hour
    });

    alert('✅ تم كتم المستخدم بنجاح');
  } catch (error) {
    alert(`❌ فشل الكتم: ${error.message}`);
  }
}
```

**الواجهة في ParticipantsSidebar:**
- الزر: "🔇 كتم" (موجود في قائمة الإجراءات)
- الدالة: `handleMuteUser(userId)`

---

### 4️⃣ رفع الكتم (Unmute)

```typescript
import { unmuteUser } from '@/lib/chatRoomsService';

async function handleUnmute() {
  try {
    await unmuteUser(roomId, userId);
    alert('✅ تم رفع الكتم بنجاح');
  } catch (error) {
    alert(`❌ فشل رفع الكتم: ${error.message}`);
  }
}
```

**الواجهة في ParticipantsSidebar:**
- الزر: "🔊 رفع الكتم"
- الدالة: `handleUnmuteUser(userId)`

---

### 5️⃣ طرد مستخدم (Kick/Remove)

```typescript
import { removeMember } from '@/lib/chatRoomsService';

async function handleKick() {
  try {
    await removeMember(roomId, userId);
    alert('✅ تم طرد المستخدم بنجاح');
  } catch (error) {
    alert(`❌ فشل الطرد: ${error.message}`);
  }
}
```

**الواجهة في ParticipantsSidebar:**
- الزر: "👢 طرد" (موجود في قائمة الإجراءات)
- الدالة: `handleRemoveMember(userId)`

---

## 🎨 واجهة المستخدم (UI)

### الموقع
`components/chat/ParticipantsSidebar.tsx` (السطور 199-265)

### الظهور
- تظهر أزرار الإدارة **فقط** للمشرفين (Owner/Admin)
- لا تظهر للمستخدم نفسه (isCurrentUser)
- شرط الظهور:
```typescript
{canModerate && !isCurrentUser && (
  <button>⚙️</button>
)}
```

### القائمة المنسدلة
عند الضغط على ⚙️، تظهر قائمة تحتوي على:
1. 🚫 **حظر** - `handleBanUser(userId)`
2. 🔇 **كتم** - `handleMuteUser(userId)`
3. 👢 **طرد** - `handleRemoveMember(userId)`
4. ✅ **رفع الحظر** - `handleUnbanUser(userId)`
5. 🔊 **رفع الكتم** - `handleUnmuteUser(userId)`

---

## 🔔 SignalR Events

عند تنفيذ أي إجراء إدارة، يتم إرسال إشعارات تلقائية:

### عند الحظر
```typescript
// في useSignalR.ts (السطر 151)
newConnection.on('RoomBanned', (roomId, reason, isPermanent, expiresAt) => {
  console.log('🚫 [SIGNALR] You were banned from room:', reason);
  if (onBanned) {
    onBanned(reason); // يستدعي callback في VoiceChatRoom
  }
});

// في VoiceChatRoom.tsx (السطر 56)
onBanned: (reason) => {
  alert(`🚫 تم حظرك من الغرفة\nالسبب: ${reason}`);
  router.push('/');
}
```

### عند الكتم
```typescript
// في useSignalR.ts (السطر 159)
newConnection.on('YouWereMuted', (roomId, reason, isPermanent, expiresAt) => {
  console.log('🔇 [SIGNALR] You were muted:', reason);
  if (onMuted) {
    onMuted(reason, expiresAt); // يستدعي callback في VoiceChatRoom
  }
});

// في VoiceChatRoom.tsx (السطر 60)
onMuted: (reason, expiresAt) => {
  const until = expiresAt ? new Date(expiresAt).toLocaleString('ar-SA') : 'دائماً';
  alert(`🔇 تم كتمك من الغرفة\nالسبب: ${reason}\nحتى: ${until}`);
}
```

### للمشرفين (رؤية الإجراءات)
```typescript
// UserBanned - في useSignalR.ts (السطر 167)
newConnection.on('UserBanned', (roomId, userId, username, bannedByUsername, reason, isPermanent, expiresAt) => {
  console.log(`🚫 [SIGNALR] ${username} was banned by ${bannedByUsername}`);
  setConnectedUsers((prev) => prev.filter(u => u.userId !== userId));
});

// UserMuted - في useSignalR.ts (السطر 181)
newConnection.on('UserMuted', (roomId, userId, username, mutedByUsername, reason, isPermanent, expiresAt) => {
  console.log(`🔇 [SIGNALR] ${username} was muted by ${mutedByUsername}`);
});
```

---

## 📊 مخطط تدفق العمليات

### حظر مستخدم (Ban Flow)

```
1. Admin يضغط "حظر" في ParticipantsSidebar
          ↓
2. handleBanUser(userId) يستدعي banUser() من chatRoomsService
          ↓
3. POST /api/chatrooms/{roomId}/ban
          ↓
4. Backend يحظر المستخدم ويرسل SignalR events:
   - RoomBanned → للمستخدم المحظور
   - UserBanned → لجميع المستخدمين في الغرفة
          ↓
5. Frontend يستقبل events:
   - المستخدم المحظور: يظهر alert ويُطرد من الغرفة
   - باقي المستخدمين: يرون المستخدم يختفي من القائمة
```

### كتم مستخدم (Mute Flow)

```
1. Admin يضغط "كتم" في ParticipantsSidebar
          ↓
2. handleMuteUser(userId) يستدعي muteUser() من chatRoomsService
          ↓
3. POST /api/chatrooms/{roomId}/mute
          ↓
4. Backend يكتم المستخدم ويرسل SignalR events:
   - YouWereMuted → للمستخدم المكتوم
   - UserMuted → لجميع المستخدمين في الغرفة
          ↓
5. Frontend يستقبل events:
   - المستخدم المكتوم: يظهر alert بالسبب والمدة
   - زر إرسال الرسائل يُعطل (إذا تم تطبيق ذلك)
```

---

## ⚠️ ملاحظات مهمة

### 1. الصلاحيات
```typescript
// في ParticipantsSidebar.tsx
const canModerate = permissions?.canModerate;

// الزر يظهر فقط إذا:
{canModerate && !isCurrentUser && (
  <button>⚙️</button>
)}
```

- يجب أن يكون المستخدم **Owner** أو **Admin**
- لا يمكن للمستخدم استخدام الإدارة على نفسه
- لا يمكن حظر/كتم Owner الغرفة

### 2. أنواع الحظر/الكتم
```typescript
type: 0 | 1 | 2
// 0 = UserOnly - المستخدم فقط
// 1 = IpOnly - الـ IP فقط
// 2 = UserAndIp - المستخدم والـ IP معاً (الأكثر أماناً)
```

**الاستخدام الافتراضي في الكود:**
```typescript
type: 2 // UserAndIp - موصى به
```

### 3. المدة الافتراضية
```typescript
// للحظر
durationInMinutes: 1440 // 24 ساعة

// للكتم
durationInMinutes: 60 // ساعة واحدة
```

### 4. معالجة الأخطاء
```typescript
try {
  await banUser(roomId, data);
  alert('✅ تم الحظر بنجاح');
} catch (error) {
  // الأخطاء الشائعة:
  // - "You don't have permission to ban users in this room"
  // - "Cannot ban room owner"
  // - "User is already banned in this room"
  alert(`❌ خطأ: ${error.message}`);
}
```

---

## 🧪 اختبار الوظائف

### خطوات الاختبار:

1. **تسجيل دخول كـ Admin:**
   ```typescript
   // تأكد من أن permissions.canModerate = true
   console.log(permissions);
   ```

2. **فتح قائمة المشاركين:**
   - اضغط على زر "المشاركون" في الشريط الجانبي
   - يجب أن ترى قائمة المستخدمين المتصلين

3. **تجربة الحظر:**
   - اضغط ⚙️ بجانب أي مستخدم
   - اختر "🚫 حظر"
   - يجب أن يختفي المستخدم من القائمة
   - افتح Console للتحقق من SignalR logs

4. **تجربة الكتم:**
   - اضغط ⚙️ بجانب مستخدم آخر
   - اختر "🔇 كتم"
   - المستخدم يبقى في القائمة لكن لا يستطيع إرسال رسائل

5. **تجربة الطرد:**
   - اضغط ⚙️ → "👢 طرد"
   - المستخدم يُطرد لكن يمكنه الدخول مرة أخرى

---

## 🐛 استكشاف الأخطاء

### المشكلة: أزرار الإدارة لا تظهر

**الحلول:**
1. تحقق من `permissions.canModerate`:
   ```typescript
   console.log('Can Moderate:', permissions?.canModerate);
   ```

2. تحقق من `isCurrentUser`:
   ```typescript
   console.log('Is Current User:', isCurrentUser);
   ```

3. تحقق من `roomId`:
   ```typescript
   console.log('Room ID:', roomId);
   ```

### المشكلة: خطأ "You don't have permission"

**الحلول:**
1. تأكد من أن المستخدم Owner أو Admin
2. تحقق من JWT Token:
   ```typescript
   console.log('Token:', localStorage.getItem('accessToken'));
   ```

### المشكلة: SignalR events لا تصل

**الحلول:**
1. تحقق من اتصال SignalR:
   ```typescript
   console.log('SignalR Connected:', isConnected);
   ```

2. تحقق من الـ event handlers في Console:
   ```
   📨 [SIGNALR] New message: ...
   👋 [SIGNALR] User joined: ...
   🚫 [SIGNALR] User banned: ...
   ```

3. تحقق من Backend logs للتأكد من إرسال الـ events

---

## 📚 مراجع إضافية

- **Backend API Documentation**: `API_MODERATION_DOCUMENTATION.md`
- **SignalR Events**: `hooks/useSignalR.ts`
- **API Functions**: `lib/chatRoomsService.ts`
- **UI Components**: `components/chat/ParticipantsSidebar.tsx`

---

**Created**: 2025-11-01
**Version**: 1.0.0
**Status**: ✅ Production Ready
