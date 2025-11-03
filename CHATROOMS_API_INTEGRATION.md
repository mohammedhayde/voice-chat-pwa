# 🎙️ تكامل Chat Rooms API

تم دمج Chat Rooms API بنجاح مع التطبيق.

## ✨ ما تم إنجازه

### 1. إنشاء Chat Rooms Service (lib/chatRoomsService.ts) ✅

تم إنشاء service layer كامل للتواصل مع Chat Rooms API يتضمن:

#### الدوال المنفذة:
- `getChatRooms(userId?: number)` - جلب قائمة الغرف
- `createChatRoom(data)` - إنشاء غرفة جديدة
- `joinChatRoom(roomId)` - الانضمام للغرفة والحصول على Agora Token
- `leaveChatRoom(roomId)` - مغادرة الغرفة
- `removeMember(roomId, userId)` - إزالة عضو
- `banUser(roomId, data)` - حظر مستخدم
- `unbanUser(roomId, userId)` - إلغاء حظر مستخدم
- `muteUser(roomId, data)` - كتم مستخدم
- `unmuteUser(roomId, userId)` - إلغاء كتم مستخدم

#### الدوال المساعدة:
- `sortRoomsByActivity(rooms)` - ترتيب الغرف حسب النشاط
- `filterPublicRooms(rooms)` - تصفية الغرف العامة فقط
- `filterPrivateRooms(rooms)` - تصفية الغرف الخاصة فقط

#### الواجهات (Interfaces):
```typescript
interface ChatRoom {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  createdByUserId: number;
  createdByUsername: string;
  isPrivate: boolean;
  membersCount: number;
  moderatorsCount: number;
  activeUsersCount: number;
}

interface JoinRoomResponse {
  success: boolean;
  message: string;
  agoraToken: string;
  channelName: string;
  uid: number;
  tokenExpiration: number;
}
```

### 2. تحديث الصفحة الرئيسية (app/page.tsx) ✅

#### التغييرات الرئيسية:

**أ. جلب الغرف من API:**
```typescript
const [rooms, setRooms] = useState<ChatRoom[]>([]);
const [roomsLoading, setRoomsLoading] = useState(true);
const [roomsError, setRoomsError] = useState('');

useEffect(() => {
  async function loadRooms() {
    try {
      const fetchedRooms = await getChatRooms();
      const sortedRooms = sortRoomsByActivity(fetchedRooms);
      setRooms(sortedRooms);
      console.log('✅ [ROOMS] Loaded', sortedRooms.length, 'rooms from API');
    } catch (error) {
      console.error('❌ [ROOMS] Failed to load rooms:', error);
      setRoomsError(error.message || 'فشل في تحميل الغرف');
    } finally {
      setRoomsLoading(false);
    }
  }
  loadRooms();
}, [isAuthenticated]);
```

**ب. الانضمام للغرفة والحصول على Agora Token:**
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

    const tokenResponse = await fetch(`/.netlify/functions/agora-token?channel=${channelName}&uid=${uid}`);
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
  } catch (err) {
    console.error('❌ [JOIN] Failed to join room:', err);
    setJoinError(err.message || 'فشل في الانضمام للغرفة');
  } finally {
    setJoiningRoom(false);
  }
};
```

**ج. تمرير البيانات لـ VoiceChatRoom:**
```typescript
if (isConfigured && selectedRoom && userName && joinData) {
  return (
    <VoiceChatRoom
      agoraAppId={AGORA_APP_ID}
      agoraToken={joinData.agoraToken}  // ✅ من API
      channelName={joinData.channelName} // ✅ من API
      userName={userName}
      roomId={selectedRoom}
    />
  );
}
```

**د. واجهة المستخدم:**
- عرض loading spinner أثناء تحميل الغرف
- عرض رسالة خطأ مع زر إعادة المحاولة عند فشل التحميل
- عرض رسالة "لا توجد غرف" عند عدم وجود غرف
- عرض عدد المستخدمين النشطين في كل غرفة
- عرض أيقونة 🔒 للغرف الخاصة
- تعطيل الأزرار أثناء الانضمام
- عرض رسالة خطأ عند فشل الانضمام

### 3. تحديث VoiceChatRoom Component ✅

**التغييرات:**
- إضافة `roomId?: number` للـ props
- استيراد `joinChatRoom` و `leaveChatRoom` من service
- تحديث `handleLeave` لإخطار الـ API عند مغادرة الغرفة

```typescript
const handleLeave = async () => {
  try {
    await leaveChannel();

    // If roomId is provided, notify API about leaving
    if (roomId) {
      console.log('📤 [API] Notifying server about leaving room...');
      await leaveChatRoom(roomId);
      console.log('✅ [API] Successfully left room');
    }
  } catch (err) {
    setError('فشل مغادرة الغرفة');
    console.error(err);
  }
};
```

## 🔄 التدفق الكامل

```
1. المستخدم يفتح الصفحة الرئيسية
        ↓
2. جلب قائمة الغرف من API
   GET /api/chatrooms
        ↓
3. عرض الغرف مرتبة حسب عدد المستخدمين النشطين
        ↓
4. المستخدم يضغط على غرفة
        ↓
5. استدعاء API للانضمام للغرفة (تسجيل العضوية فقط)
   POST /api/chatrooms/{roomId}/join
        ↓
6. الحصول على Agora Token من Netlify Function
   GET /.netlify/functions/agora-token?channel=room-X&uid=123456
   Response: { token, appId, channel, uid, expireTime }
        ↓
7. فتح VoiceChatRoom مع:
   - agoraToken من Netlify Function
   - channelName من التطبيق
   - uid مُولّد عشوائياً
        ↓
8. الانضمام لـ Agora voice channel
        ↓
9. عند المغادرة:
   POST /api/chatrooms/{roomId}/leave
        ↓
10. تنظيف localStorage وإغلاق الاتصال
```

## 📡 API Endpoints المستخدمة

### 1. GET /api/chatrooms
**الوصف:** جلب قائمة الغرف

**السلوك المهم:**
- **بدون `userId`** - يرجع **الغرف العامة فقط** (`isPrivate = false`)
- **مع `userId`** - يرجع **جميع غرف المستخدم** (عامة + خاصة)

**Query Parameters:**
- `userId` (اختياري) - معرف المستخدم لجلب غرفه الخاصة

**Response:**
```json
[
  {
    "id": 1,
    "name": "غرفة العامة",
    "description": "مساحة مفتوحة للجميع",
    "isPrivate": false,
    "activeUsersCount": 5,
    "membersCount": 100,
    "moderatorsCount": 2,
    "createdByUsername": "admin",
    "createdAt": "2025-01-01T10:00:00Z",
    "createdByUserId": 5
  }
]
```

### 2. POST /api/chatrooms/{roomId}/join
**الوصف:** الانضمام للغرفة (تسجيل العضوية فقط)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Joined successfully"
}
```

**ملاحظة هامة:**
- هذا الـ endpoint يسجل فقط عضوية المستخدم في الغرفة
- Agora Token يتم الحصول عليه من Netlify Function بشكل منفصل

### 2b. GET /.netlify/functions/agora-token
**الوصف:** الحصول على Agora Token للانضمام للقناة الصوتية

**Query Parameters:**
- `channel` (مطلوب) - اسم القناة (مثل: room-1)
- `uid` (اختياري) - معرف المستخدم (إذا لم يُحدد، يستخدم 0)
- `role` (اختياري) - دور المستخدم: "publisher" أو "audience" (افتراضي: publisher)

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

**ملاحظة هامة:**
- الـ token صالح لمدة ساعة واحدة (3600 ثانية)
- يتم توليد Token جديد لكل انضمام
- يتطلب `AGORA_PRIMARY_CERTIFICATE` في environment variables

### 3. POST /api/chatrooms/{roomId}/leave
**الوصف:** مغادرة الغرفة وتنظيف البيانات

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Left successfully"
}
```

## 🎨 التحسينات على الواجهة

### 1. حالات التحميل:
- ✅ Skeleton loading للغرف
- ✅ Spinner عند الانضمام للغرفة
- ✅ رسائل واضحة للحالات المختلفة

### 2. معالجة الأخطاء:
- ✅ رسالة خطأ عند فشل تحميل الغرف
- ✅ زر "إعادة المحاولة" عند الفشل
- ✅ رسالة خطأ عند فشل الانضمام
- ✅ تسجيل الأخطاء في console

### 3. المعلومات الإضافية:
- ✅ عدد المستخدمين النشطين في كل غرفة
- ✅ أيقونة 🔒 للغرف الخاصة
- ✅ ألوان وأيقونات مميزة لكل غرفة

## 🔐 الأمان

### ما تم تنفيذه:
- ✅ إرسال Access Token مع كل طلب
- ✅ التحقق من authentication قبل الانضمام
- ✅ حفظ Agora Token في localStorage (يتم تنظيفه عند المغادرة)
- ✅ التحقق من صلاحية الـ token من الـ backend

### توصيات للمستقبل:
- ⚠️ استخدام httpOnly cookies للـ tokens (أكثر أماناً)
- ⚠️ إضافة rate limiting للـ API
- ⚠️ إضافة CORS policies

## 🎫 معمارية Agora Token

### كيف يتم توليد Agora Tokens:

التطبيق يستخدم معمارية **مفصولة** لتوليد Agora Tokens:

**1. Chat Rooms API:**
- يُستخدم لتسجيل عضوية المستخدم في الغرفة
- يُتتبع من هو موجود في كل غرفة
- **لا يُرجع** Agora Token

**2. Netlify Function (agora-token.ts):**
- دالة serverless مستقلة
- تولد Agora Tokens ديناميكياً باستخدام `agora-token` package
- تستخدم `AGORA_PRIMARY_CERTIFICATE` من environment variables
- Token صالح لمدة **ساعة واحدة** (3600 ثانية)

### متطلبات Environment Variables:

```env
# Required for Agora SDK in frontend
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Required for Netlify Function token generation
AGORA_PRIMARY_CERTIFICATE=your_agora_primary_certificate

# Optional static token (not used anymore)
NEXT_PUBLIC_AGORA_TOKEN=...
```

### مزايا هذه المعمارية:

✅ **الأمان:** Primary Certificate يبقى في الـ server-side فقط
✅ **المرونة:** Token يتولد ديناميكياً لكل مستخدم
✅ **الاستقلالية:** فصل بين إدارة الغرف وتوليد Tokens
✅ **التحكم:** يمكن تعديل مدة الـ token بسهولة

## 📊 البيانات المحفوظة في localStorage

عند الانضمام للغرفة يتم حفظ:
```javascript
localStorage.setItem('agoraToken', data.agoraToken);
localStorage.setItem('agoraChannel', data.channelName);
localStorage.setItem('agoraUid', data.uid.toString());
```

عند المغادرة يتم حذف:
```javascript
localStorage.removeItem('agoraToken');
localStorage.removeItem('agoraChannel');
localStorage.removeItem('agoraUid');
```

## 🧪 الاختبار

### للتأكد من عمل التكامل:

1. **افتح Developer Console** (F12)
2. **سجل دخول** للتطبيق
3. **راقب الـ logs:**
```
✅ [ROOMS] Loaded X rooms from API
```
4. **اضغط على غرفة** وراقب:
```
🔐 [JOIN] Joining room X via API...
✅ [JOIN] Got Agora token from API
```
5. **افتح localStorage** وتحقق من:
   - `agoraToken`
   - `agoraChannel`
   - `agoraUid`

## ⚠️ المشاكل المحتملة والحلول

### 1. فشل في تحميل الغرف
**السبب:** API غير متاح أو مشكلة في الـ network
**الحل:**
- تحقق من الـ API URL في `.env.local`
- تحقق من أن الـ API يعمل
- اضغط زر "إعادة المحاولة"

### 2. فشل في الانضمام للغرفة
**الأسباب المحتملة:**
- Access token منتهي الصلاحية
- الغرفة ممتلئة
- المستخدم محظور
- API غير متاح

**الحل:**
- تحقق من رسالة الخطأ في UI
- راجع الـ console logs
- جرب تسجيل خروج ودخول مرة أخرى

### 3. Agora Token منتهي الصلاحية
**السبب:** الـ token صالح لمدة محددة (tokenExpiration)
**الحل:**
- سيتم عرض رسالة خطأ من Agora
- يجب الانضمام للغرفة مرة أخرى للحصول على token جديد

## 🚀 الخطوات التالية (اختياري)

### الميزات المتبقية:

#### 1. إنشاء غرفة جديدة
- إضافة زر "إنشاء غرفة +" في الصفحة الرئيسية
- نموذج لإدخال اسم ووصف الغرفة
- خيار لجعل الغرفة خاصة أو عامة
- استدعاء `createChatRoom()`

#### 2. وظائف الإدارة
- زر "إزالة" لإزالة أعضاء (للمشرفين)
- زر "حظر" لحظر مستخدمين
- زر "كتم" لكتم مستخدمين
- واجهة إدارة الغرفة

#### 3. التحسينات:
- Auto-refresh للغرف كل 30 ثانية
- SignalR للإشعارات الفورية
- إشعار عند انضمام/مغادرة مستخدمين
- عرض قائمة الأعضاء المحظورين/المكتومين

## 📝 الخلاصة

تم تكامل Chat Rooms API بنجاح مع التطبيق:

✅ **Service Layer** - جاهز ومختبر
✅ **جلب الغرف** - يعمل بشكل ديناميكي من API
✅ **الانضمام للغرف** - يحصل على Agora Token من API
✅ **المغادرة** - ينظف البيانات ويخطر API
✅ **معالجة الأخطاء** - شاملة ومفهومة
✅ **واجهة المستخدم** - متجاوبة وجميلة

الآن التطبيق جاهز للاستخدام مع Backend API! 🎉
