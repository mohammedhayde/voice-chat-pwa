# Netlify Environment Variables Setup

## 📋 Required Environment Variables

Add these environment variables to your Netlify Dashboard.

**Location:** Netlify Dashboard → Site settings → Environment variables

> **⚠️ Important:** Replace placeholder values with your actual credentials.
>
> **Actual values are stored in:**
> - `.env.local` (for local development - not in git)
> - Netlify Dashboard (for production)
> - Google Cloud Console (for OAuth credentials)
> - Service provider dashboards (Agora, Pusher)

---

## 🔐 NextAuth Configuration

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-min-32-characters
```

**How to generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🔑 Google OAuth Credentials

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
```

**Get credentials from:**
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

---

## 🌐 Backend API

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

---

## 🎙️ Agora (Voice Chat)

```env
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
AGORA_PRIMARY_CERTIFICATE=your_agora_certificate
```

**Get credentials from:**
- [Agora Console](https://console.agora.io)

---

## 💬 Pusher (Text Chat)

```env
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
```

**Get credentials from:**
- [Pusher Dashboard](https://dashboard.pusher.com)

---

## ✅ Checklist

- [ ] All environment variables added to Netlify
- [ ] Google OAuth redirect URI configured: `https://your-domain.com/api/auth/callback/google`
- [ ] Site redeployed after adding variables
- [ ] Test Google login at: `https://your-domain.com/login`

---

## 🔧 How to Add Variables in Netlify

1. Go to: https://app.netlify.com/sites/YOUR_SITE_NAME/settings/deploys#environment
2. Click **"Add a variable"** or **"Edit variables"**
3. Add each variable name and value
4. Click **"Save"**
5. Trigger a new deploy

---

## 🚨 Security Notes

- Never commit these values to Git
- Keep `.env.local` in `.gitignore`
- Only share credentials through secure channels
- Rotate secrets regularly

---

## 📞 Support

If you have issues:
1. Check all variables are spelled correctly (case-sensitive)
2. Verify no extra spaces in values
3. Ensure site is redeployed after changes
4. Check browser console for errors
