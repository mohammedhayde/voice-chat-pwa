# دليل الاختبار على الموبايل 📱

## المشكلة
- `localhost` لا يعمل من الموبايل
- الميكروفون يتطلب HTTPS على الموبايل
- HTTP لن يعمل أبداً!

## الحل: استخدام ngrok

### 1. تثبيت ngrok

#### Windows:
```bash
# استخدام Chocolatey
choco install ngrok

# أو تحميل مباشر من:
# https://ngrok.com/download
```

#### Linux/WSL:
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### 2. إنشاء حساب مجاني
- اذهب إلى: https://dashboard.ngrok.com/signup
- سجل حساب مجاني
- احصل على authtoken

### 3. ربط ngrok بحسابك
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 4. تشغيل التطبيق
```bash
# Terminal 1: شغل Next.js
npm run dev

# Terminal 2: شغل ngrok
ngrok http 3004
```

### 5. افتح الرابط على الموبايل
سيعطيك ngrok رابط مثل:
```
https://abc123.ngrok-free.app
```

افتح هذا الرابط من موبايلك! ✅

---

## بديل: النشر على Netlify (للإنتاج)

⚠️ **تنبيه**: API routes لن تعمل مع static export!

### المشكلة الحالية:
- `next.config.ts` معد كـ `output: 'export'`
- `/api/pusher/auth` لن يعمل في static export
- Pusher Presence Channels تحتاج backend

### الحل:
1. استخدم Vercel بدلاً من Netlify (يدعم API routes)
2. أو أنشئ backend منفصل للـ Pusher auth
3. أو استخدم Pusher public channels بدلاً من presence

---

## خيارات أخرى

### خيار 1: HTTPS محلي (معقد)
- تثبيت mkcert
- إنشاء شهادات SSL
- تعديل Next.js config

### خيار 2: استخدام Vercel/Railway للنشر
- دعم كامل لـ API routes
- HTTPS تلقائي
- سهل النشر

---

## ملاحظات مهمة

### متطلبات الميكروفون على الموبايل:
✅ يجب استخدام HTTPS
✅ يجب أن يكون النطاق آمن
✅ يجب طلب الأذونات بشكل صحيح

### متطلبات Pusher:
✅ يجب وجود backend لـ authentication
✅ presence channels تحتاج server-side auth
✅ client events يجب تفعيلها في Pusher dashboard

---

## التوصية النهائية 🎯

**للتطوير السريع**: استخدم ngrok
**للإنتاج**: استخدم Vercel أو Railway (ليس Netlify static export)
