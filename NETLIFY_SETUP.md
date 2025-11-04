# Netlify Environment Variables Setup - إعداد متغيرات البيئة

## المشكلة الحالية ❌

إذا واجهت الأخطاء التالية:
```
[next-auth][error][CLIENT_FETCH_ERROR]
/api/auth/session: 500 Internal Server Error
```

**السبب:** متغيرات البيئة غير مضافة في Netlify.

---

## الحل - إضافة المتغيرات في Netlify ✅

### الخطوة 1: افتح إعدادات Netlify

1. اذهب إلى [Netlify Dashboard](https://app.netlify.com/)
2. اختر موقعك (drdsh.me)
3. اضغط على **Site settings**
4. من القائمة الجانبية، اختر **Environment variables**

### الخطوة 2: أضف المتغيرات التالية

اضغط **Add a variable** لكل متغير من القائمة التالية:

#### 1. NextAuth Configuration

| Variable Name | Value | ملاحظات |
|--------------|-------|---------|
| `NEXTAUTH_URL` | `https://drdsh.me` | رابط موقعك |
| `NEXTAUTH_SECRET` | `KSptVi3KCYHqHiBX2sIeHfvn/jRzI5VjiWxaP6ayolA=` | مولد من openssl |

#### 2. Google OAuth

| Variable Name | Value | Where to find |
|--------------|-------|---------------|
| `GOOGLE_CLIENT_ID` | (من Google Cloud Console) | **APIs & Services** → **Credentials** |
| `GOOGLE_CLIENT_SECRET` | (من Google Cloud Console) | **APIs & Services** → **Credentials** |

**ملاحظة:** احصل على هذه القيم من [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.

#### 3. Agora (Voice Chat)

| Variable Name | موجود بالفعل؟ | Where to find |
|--------------|-------------|---------------|
| `NEXT_PUBLIC_AGORA_APP_ID` | ✅ | Check `.env.local` |
| `AGORA_PRIMARY_CERTIFICATE` | ✅ | Check `.env.local` |

#### 4. Pusher (Text Chat)

| Variable Name | موجود بالفعل؟ | Where to find |
|--------------|-------------|---------------|
| `NEXT_PUBLIC_PUSHER_KEY` | ✅ | Check `.env.local` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | ✅ | `eu` |
| `PUSHER_APP_ID` | ✅ | Check `.env.local` |
| `PUSHER_SECRET` | ✅ | Check `.env.local` |

#### 5. Backend API

| Variable Name | Value | موجود بالفعل؟ |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://backend-chatroom-api.fly.dev/api` | ✅ |

**ملاحظة:** جميع القيم المذكورة "Check `.env.local`" موجودة بالفعل في ملف `.env.local` المحلي. انسخها من هناك.

---

## الخطوة 3: احفظ وأعد البناء

بعد إضافة جميع المتغيرات:

1. اضغط **Save** في Netlify
2. اذهب إلى **Deploys** tab
3. اضغط **Trigger deploy** → **Clear cache and deploy site**
4. انتظر حتى ينتهي البناء (حوالي 2-3 دقائق)

---

## التحقق من النجاح ✅

بعد إعادة البناء:

1. افتح `https://drdsh.me/login`
2. افتح **Developer Console** (F12)
3. اضغط على **Console** tab
4. يجب أن ترى:
   ```
   🔑 [NEXTAUTH CONFIG] Environment check:
   - NEXTAUTH_SECRET: ✅ Present
   - NEXTAUTH_URL: https://drdsh.me
   - GOOGLE_CLIENT_ID: ✅ Present
   - GOOGLE_CLIENT_SECRET: ✅ Present
   ```

5. جرب الضغط على زر **"تسجيل الدخول باستخدام Google"**
6. يجب أن يتم توجيهك إلى صفحة Google OAuth

---

## Troubleshooting 🔧

### المشكلة: لا يزال خطأ 500

**الحل:**
1. تأكد من نسخ القيم **بالضبط** كما هي (بدون مسافات زائدة)
2. تأكد من اختيار **All scopes** عند إضافة المتغيرات
3. جرب **Clear cache and deploy** مرة أخرى

### المشكلة: "redirect_uri_mismatch"

**الحل:**
1. افتح [Google Cloud Console](https://console.cloud.google.com/)
2. اذهب إلى **APIs & Services** → **Credentials**
3. تأكد من إضافة:
   ```
   https://drdsh.me/api/auth/callback/google
   ```
   في **Authorized redirect URIs**

### المشكلة: المتغيرات موجودة لكن لا تعمل

**الحل:**
1. احذف المتغيرات القديمة
2. أضفها من جديد
3. أعد البناء بـ **Clear cache**

---

## صورة توضيحية للخطوات 📸

### 1. موقع إضافة المتغيرات:
```
Netlify Dashboard
  → Your Site (drdsh.me)
    → Site settings (من القائمة العلوية)
      → Environment variables (من القائمة الجانبية)
        → Add a variable (الزر الأخضر)
```

### 2. إضافة متغير واحد:
```
Key: NEXTAUTH_SECRET
Value: (القيمة من .env.local أو من openssl rand -base64 32)
Scopes: All scopes (أو اختر production فقط)
→ Create variable
```

### 3. كرر لجميع المتغيرات المذكورة أعلاه.

---

## قائمة التحقق النهائية ✓

قبل إعادة البناء، تأكد من:

- [ ] تم إضافة `NEXTAUTH_URL`
- [ ] تم إضافة `NEXTAUTH_SECRET`
- [ ] تم إضافة `GOOGLE_CLIENT_ID`
- [ ] تم إضافة `GOOGLE_CLIENT_SECRET`
- [ ] تم حفظ جميع المتغيرات
- [ ] تم عمل **Clear cache and deploy**
- [ ] تم الانتظار حتى انتهاء البناء

---

## ملاحظات مهمة ⚠️

1. **لا تشارك** هذه القيم مع أي شخص
2. **لا ترفعها** إلى GitHub أبداً
3. إذا تم تسريبها، **غيّر** Client Secret من Google Console
4. المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` يمكن رؤيتها في المتصفح (عادي)
5. المتغيرات الأخرى **سرية** ومخفية

---

## دعم إضافي 💬

إذا واجهت أي مشكلة:
1. تحقق من **Build logs** في Netlify
2. تحقق من **Function logs** في Netlify
3. تحقق من **Browser Console** (F12)
4. ابحث عن الأخطاء وشاركها للمساعدة

---

**بعد اتباع هذه الخطوات، Google Sign In يجب أن يعمل بشكل صحيح!** 🎉
