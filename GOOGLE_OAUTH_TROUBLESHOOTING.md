# Google OAuth Troubleshooting Guide

## ❌ Error: `AccessDenied`

If you see: `https://drdsh.me/login?error=AccessDenied`

This means NextAuth's signIn callback returned `false`. Here's how to fix it:

---

## 🔍 Step 1: Check Netlify Logs

1. Go to: https://app.netlify.com/sites/YOUR_SITE_NAME/logs
2. Look for logs starting with `🔐 [NextAuth]`
3. Find the error messages (lines starting with `❌`)

---

## ✅ Step 2: Verify NEXT_PUBLIC_API_URL

**Most common issue:** Incorrect `NEXT_PUBLIC_API_URL` in Netlify.

### Correct Value:
```env
NEXT_PUBLIC_API_URL=https://backend-chatroom-api.fly.dev/api
```

**Note:** Must end with `/api`

### How to Check/Fix:
1. Netlify Dashboard → Site settings → Environment variables
2. Find `NEXT_PUBLIC_API_URL`
3. Ensure it's: `https://backend-chatroom-api.fly.dev/api` (with `/api` at the end)
4. Save and redeploy

---

## ✅ Step 3: Test Backend Endpoint Manually

Test if backend is reachable:

```bash
curl -X POST https://backend-chatroom-api.fly.dev/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "googleId": "123456789",
    "picture": "https://example.com/pic.jpg"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "token": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "picture": "...",
    "role": "User"
  }
}
```

**If you get an error:**
- Backend is down
- Backend URL is incorrect
- Backend doesn't have `/api/auth/google-login` endpoint

---

## ✅ Step 4: Verify Google OAuth Credentials

In Netlify Dashboard → Environment variables:

```env
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR-CLIENT-SECRET
NEXTAUTH_SECRET=YOUR-NEXTAUTH-SECRET-MIN-32-CHARS
```

Make sure:
- No typos
- No extra spaces
- CLIENT_SECRET is not a placeholder
- NEXTAUTH_SECRET is not `your-secret-32-characters-minimum`

---

## ✅ Step 5: Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Open your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure you have:
   ```
   https://drdsh.me/api/auth/callback/google
   ```
4. Under "Authorized JavaScript origins":
   ```
   https://drdsh.me
   ```

---

## 🔧 Common Issues & Solutions

### Issue 1: URL ends with `/api/api/auth/google-login`

**Cause:** `NEXT_PUBLIC_API_URL` includes `/auth` or code is building URL incorrectly

**Fix:** Set `NEXT_PUBLIC_API_URL=https://backend-chatroom-api.fly.dev/api`

---

### Issue 2: Backend returns 404

**Check logs for:**
```
❌ [NextAuth] Backend error status: 404
```

**Cause:** Backend endpoint doesn't exist

**Fix:** Verify backend has `/api/auth/google-login` endpoint

---

### Issue 3: Backend returns 400/500

**Check logs for:**
```
❌ [NextAuth] Backend error status: 400
❌ [NextAuth] Backend error response: ...
```

**Cause:** Backend validation error or server error

**Fix:** Check backend logs for details

---

### Issue 4: CORS Error

**Check browser console for:**
```
Access to fetch at '...' from origin 'https://drdsh.me' has been blocked by CORS policy
```

**Cause:** Backend doesn't allow requests from frontend domain

**Fix:** Add CORS headers in backend for `https://drdsh.me`

---

## 📊 Debug Checklist

- [ ] `NEXT_PUBLIC_API_URL` ends with `/api`
- [ ] `GOOGLE_CLIENT_SECRET` is not a placeholder
- [ ] `NEXTAUTH_SECRET` is not a placeholder
- [ ] Google redirect URI includes: `https://drdsh.me/api/auth/callback/google`
- [ ] Backend endpoint `/api/auth/google-login` exists and works
- [ ] Netlify site redeployed after environment variable changes
- [ ] Checked Netlify function logs for errors

---

## 🆘 Still Not Working?

Check the detailed logs in Netlify:

1. Netlify Dashboard → Functions → `[...nextauth]`
2. Look for the full request/response logs
3. Share the logs (remove sensitive data) for help

---

## 📝 Example of Working Configuration

**Netlify Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://backend-chatroom-api.fly.dev/api
NEXTAUTH_URL=https://drdsh.me
NEXTAUTH_SECRET=YOUR-NEXTAUTH-SECRET-MIN-32-CHARS
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR-CLIENT-SECRET
```

**Google Cloud Console:**
- Redirect URI: `https://drdsh.me/api/auth/callback/google`
- JavaScript origin: `https://drdsh.me`

**Expected flow:**
1. User clicks "Login with Google"
2. NextAuth → Google → User approves
3. NextAuth receives Google user data
4. NextAuth → POST `https://backend-chatroom-api.fly.dev/api/auth/google-login`
5. Backend returns JWT token
6. User redirected to home page

