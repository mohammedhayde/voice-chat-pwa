# 🚀 تشغيل المشروع باستخدام ngrok

ngrok يوفر لك HTTPS مجاني فوراً! ✅

## 📋 الخطوات (5 دقائق فقط)

### الخطوة 1: إنشاء حساب ngrok مجاني 🆓

1. اذهب إلى: [ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. سجل بالبريد الإلكتروني أو Google أو GitHub
3. تحقق من بريدك الإلكتروني (إذا لزم)

### الخطوة 2: احصل على Authtoken 🔑

1. بعد تسجيل الدخول، اذهب إلى: [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
2. انسخ الـ authtoken (يبدأ بـ `2...`)

### الخطوة 3: أضف Authtoken إلى ngrok 🔧

```bash
# في مجلد المشروع
cd /mnt/c/Users/hamod/Downloads/voice-chat-pwa

# أضف الـ authtoken (غيّر YOUR_TOKEN بالـ token الخاص بك)
./ngrok config add-authtoken YOUR_TOKEN_HERE
```

**مثال:**
```bash
./ngrok config add-authtoken 2abc123def456ghi789jkl0
```

### الخطوة 4: شغّل التطبيق 🎯

```bash
# تأكد أن التطبيق يعمل على المنفذ 3002
# إذا لم يكن يعمل:
npm run dev

# في نافذة أخرى، شغّل ngrok:
cd /mnt/c/Users/hamod/Downloads/voice-chat-pwa
./ngrok http 3002
```

### الخطوة 5: احصل على الرابط 🌐

بعد تشغيل ngrok، سترى شاشة مثل هذه:

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3002

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 🎉 الرابط جاهز!

انسخ الرابط الذي يبدأ بـ **https://** (مثل: `https://abc123.ngrok-free.app`)

**شارك هذا الرابط مع أي شخص!**
- ✅ يعمل من أي جهاز
- ✅ يعمل من الهاتف
- ✅ الميكروفون سيعمل (HTTPS)
- ✅ يمكن تثبيته كـ PWA

---

## 🛠️ أوامر سريعة

### تشغيل ngrok فقط:
```bash
cd /mnt/c/Users/hamod/Downloads/voice-chat-pwa
./ngrok http 3002
```

### تشغيل مع منطقة معينة:
```bash
# أوروبا
./ngrok http 3002 --region eu

# آسيا
./ngrok http 3002 --region ap

# أستراليا
./ngrok http 3002 --region au
```

### فتح واجهة التحكم:
بعد تشغيل ngrok، افتح في المتصفح:
```
http://localhost:4040
```
هنا يمكنك مشاهدة جميع الطلبات والاستجابات!

---

## 💡 نصائح مهمة

### ⚠️ إعادة تشغيل ngrok
كل مرة تشغل ngrok، سيتغير الرابط!
- الرابط المجاني يتغير عند كل إعادة تشغيل
- إذا أردت رابط ثابت، ترقّى للخطة المدفوعة ($8/شهر)

### 🚀 إبقاء ngrok يعمل
ngrok سيعمل طالما النافذة مفتوحة:
- لا تغلق النافذة
- إذا أغلقتها، شغله مرة أخرى

### 🔄 إيقاف ngrok
```bash
# اضغط Ctrl + C في نافذة ngrok
```

---

## 🆓 حدود الخطة المجانية

الخطة المجانية تشمل:
- ✅ 3 نطاقات متزامنة
- ✅ 40 اتصال في الدقيقة
- ✅ بدون حد زمني
- ✅ HTTPS مجاني
- ⚠️ الرابط يتغير عند كل تشغيل
- ⚠️ صفحة تحذير قبل الدخول للموقع (يمكن تخطيها)

**للاستخدام الشخصي والتجربة، هذا أكثر من كافٍ!**

---

## 🔐 البدائل

### LocalTunnel (بدون تسجيل):
```bash
npm install -g localtunnel
lt --port 3002
```

### Cloudflare Tunnel (مجاني + رابط ثابت):
```bash
# حمّل cloudflared من: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:3002
```

---

## 📚 روابط مفيدة

- [ngrok Dashboard](https://dashboard.ngrok.com/)
- [ngrok Documentation](https://ngrok.com/docs)
- [نسخة متقدمة من ngrok](https://ngrok.com/pricing)

---

## ❓ استكشاف الأخطاء

### خطأ "authentication failed":
```bash
# أضف authtoken مرة أخرى
./ngrok config add-authtoken YOUR_TOKEN
```

### "Failed to bind to port":
```bash
# تأكد أن التطبيق يعمل على 3002
npm run dev
# ثم في نافذة أخرى:
./ngrok http 3002
```

### "tunnel not found":
```bash
# امسح التكوين وأعد إضافة authtoken
rm ~/.ngrok2/ngrok.yml
./ngrok config add-authtoken YOUR_TOKEN
```

---

## 🎯 الخطوات المختصرة

```bash
# 1. سجل على ngrok.com واحصل على token

# 2. أضف authtoken
./ngrok config add-authtoken YOUR_TOKEN

# 3. شغّل التطبيق
npm run dev

# 4. في نافذة أخرى، شغّل ngrok
./ngrok http 3002

# 5. انسخ الرابط https:// واستخدمه!
```

---

**بالتوفيق! 🚀**
