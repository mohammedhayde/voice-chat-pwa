# إصلاح تسجيل الدخول كضيف

## المشكلة الأصلية

كان تسجيل الدخول كضيف يحتوي على **offline mode fallback** يقوم بإنشاء tokens محلية عندما يفشل الاتصال بـ Backend:

```typescript
accessToken: `offline-guest-${guestId}-${Date.now()}`
```

### المشكلة:
- هذا الـ **offline token** لن يُقبل من الـ Backend API
- عند محاولة الانضمام للغرف، سيفشل التوثيق
- المستخدم سيرى الواجهة لكن لن يتمكن من استخدام أي ميزة تتطلب Backend

---

## الحل المطبق

### ✅ إزالة Offline Mode Fallback

تم تعديل `lib/authService.ts` - وظيفة `guestLogin()`:

**قبل:**
```typescript
export async function guestLogin(): Promise<AuthResponse> {
  try {
    // محاولة الاتصال بـ API
    const response = await fetch(`${API_BASE_URL}/guest-login`, ...);
    // ...
  } catch (error) {
    // ❌ إنشاء offline session
    const guestData = {
      accessToken: `offline-guest-${guestId}-${Date.now()}`,
      // ...
    };
    return guestData;
  }
}
```

**بعد:**
```typescript
export async function guestLogin(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/guest-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    // ✅ رمي خطأ واضح بدلاً من offline mode
    throw new Error(data.message || 'فشل في تسجيل الدخول كضيف. يرجى التأكد من أن الخادم متاح.');
  }

  // حفظ الـ tokens الصحيحة من الخادم
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.userId.toString());
  localStorage.setItem('username', data.username);
  localStorage.setItem('isGuest', 'true');

  return data;
}
```

---

## التحقق من Backend API

### 1. التأكد من وجود Guest Login Endpoint

يجب أن يكون لدى Backend endpoint:

```
POST https://backend-chatroom-api.fly.dev/api/auth/guest-login
```

### 2. الاستجابة المتوقعة

يجب أن يعيد Backend:

```json
{
  "userId": 123456,
  "username": "Guest_123456",
  "email": "",
  "role": "Guest",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. اختبار من Terminal

```bash
curl -X POST https://backend-chatroom-api.fly.dev/api/auth/guest-login \
  -H "Content-Type: application/json"
```

يجب أن ترى استجابة تحتوي على `accessToken` و `refreshToken`.

---

## كيفية الاختبار

### 1. في المتصفح

1. افتح التطبيق: `http://localhost:3000/login`
2. افتح **Developer Tools** (F12)
3. اذهب إلى **Console**
4. اضغط على **"دخول كضيف"**

### 2. التحقق من النتيجة

**✅ نجح تسجيل الدخول:**
```
✅ Guest login successful: Guest_123456
```

**❌ فشل تسجيل الدخول:**
```
Error: فشل في تسجيل الدخول كضيف. يرجى التأكد من أن الخادم متاح.
```

### 3. التحقق من LocalStorage

في **Developer Tools** → **Application** → **Local Storage**:

يجب أن ترى:
- `accessToken`: JWT token (طويل)
- `refreshToken`: JWT token (طويل)
- `userId`: رقم
- `username`: `Guest_XXXXXX`
- `isGuest`: `true`

---

## إذا فشل Guest Login

### الأسباب المحتملة:

1. **Backend غير متاح**
   - تحقق من أن Backend يعمل على: `https://backend-chatroom-api.fly.dev`

2. **Endpoint غير موجود**
   - تحقق من أن Backend يدعم `/api/auth/guest-login`

3. **مشكلة في CORS**
   - تحقق من أن Backend يسمح بطلبات من Frontend domain

### الحل المؤقت:

إذا كان Backend لا يدعم guest login حالياً، يمكن:

1. **استخدام تسجيل دخول عادي** بدلاً من ضيف
2. **طلب من Backend developer** لإضافة `/guest-login` endpoint
3. **إضافة معلومات تجريبية** في صفحة Login لاختبار التطبيق

---

## التحديثات المطلوبة على Backend

إذا لم يكن `/guest-login` موجود، يجب على Backend إضافة:

### Endpoint Specification:

```
POST /api/auth/guest-login
Content-Type: application/json

Response (200 OK):
{
  "userId": number,
  "username": string,  // مثل: "Guest_123456"
  "email": string,     // فارغ للضيوف
  "role": string,      // "Guest"
  "accessToken": string,  // JWT valid لمدة 15 دقيقة
  "refreshToken": string  // JWT valid لمدة 7 أيام
}
```

### المتطلبات:
- ✅ لا يتطلب بيانات في Body
- ✅ ينشئ user مؤقت بدور "Guest"
- ✅ يعيد access token و refresh token صالحين
- ✅ الـ tokens يجب أن تعمل مع باقي الـ API endpoints

---

## الخلاصة

✅ تم إزالة offline mode fallback
✅ تسجيل الدخول كضيف يتطلب الآن Backend
✅ رسائل خطأ واضحة عند فشل الاتصال
✅ الـ tokens الناتجة صالحة للاستخدام مع API

**ملاحظة:** إذا كان Backend لا يدعم `/guest-login`، يجب تحديث Backend أولاً قبل استخدام هذه الميزة.
