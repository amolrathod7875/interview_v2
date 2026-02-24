# ️ Vercel Environment Variables Setup

##  IMPORTANT: Set These in Vercel Dashboard

After deploying your frontend to Vercel, you **MUST** configure environment variables in the Vercel dashboard.

---

##  Where to Set Environment Variables

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar
4. Add each variable below

---

##  Required Environment Variables

### Backend API URL (CRITICAL!)

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

**️ Replace with your actual backend URL:**
- If using Render: `https://your-app-name.onrender.com`
- If using Railway: `https://your-app.up.railway.app`
- If using Heroku: `https://your-app.herokuapp.com`

**DO NOT include a trailing slash!**

---

### Firebase Configuration

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_PROJECT_ID=your-firebase-project-id
VITE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_measurement_id
```

---

### VAPI Voice AI

```
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
```

---

##  Step-by-Step Guide

### 1. Get Your Backend URL

First, deploy your backend and note the URL:

**Render:**
```
https://ai-interview-backend.onrender.com
```

**Railway:**
```
https://ai-interview-backend.up.railway.app
```

### 2. Set Environment Variables in Vercel

1. Visit: https://vercel.com/dashboard
2. Select your project (e.g., `interview-v2`)
3. Go to: **Settings → Environment Variables**
4. Click **Add New**
5. Add each variable one by one:

   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.onrender.com`
   - **Environments**: Check all (Production, Preview, Development)
   - Click **Save**

6. Repeat for all Firebase and VAPI variables

### 3. Redeploy After Adding Variables

️ **Environment variables only take effect after redeployment!**

Option A: Push a new commit
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

Option B: Manual redeploy in Vercel
1. Go to **Deployments** tab
2. Click the **•••** menu on latest deployment
3. Click **Redeploy**

---

##  Verify Setup

After redeployment:

1. Open your Vercel app: `https://your-app.vercel.app`
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Try to login/signup
5. Check Network tab for API calls

### Expected Result:
- API calls should go to: `https://your-backend-url.onrender.com/user/sync`
- Should return 200 status (not 404)
- No CORS errors

---

##  Common Issues

### Issue: Still getting 404 errors

**Solution:**
1. Verify `VITE_API_BASE_URL` has no trailing slash
2. Check backend is running: Visit `https://your-backend-url.onrender.com/` in browser
3. Should see: `{"status":"Active","message":"Backend is running successfully "}`

### Issue: CORS errors persist

**Solution:**
1. Update backend environment variable `FRONTEND_URL` with your Vercel URL
2. Restart backend service
3. Verify CORS allows your frontend URL in `backend/main.js`

### Issue: Firebase errors

**Solution:**
1. Double-check all Firebase variables are correct
2. Ensure no extra spaces or quotes
3. Verify Firebase project is configured properly

---

##  Quick Checklist

- [ ] Backend is deployed and running
- [ ] Backend URL is noted (e.g., `https://ai-interview-backend.onrender.com`)
- [ ] All environment variables added in Vercel dashboard
- [ ] No trailing slashes in URLs
- [ ] Redeployed after adding variables
- [ ] Tested login/signup functionality
- [ ] No 404 or CORS errors in console

---

##  Pro Tips

1. **Use different Firebase projects** for dev and production
2. **Set up preview environments** in Vercel with staging backend
3. **Monitor logs** in both Vercel and backend hosting platform
4. **Enable error tracking** (e.g., Sentry) for production
5. **Keep environment variables documented** securely (not in Git!)

---

##  Useful Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Console](https://console.firebase.google.com/)

---

##  Need Help?

If you're still having issues:
1. Check Vercel deployment logs
2. Check backend logs (Render/Railway)
3. Verify all URLs are correct and accessible
4. Test API endpoints directly with Postman/curl
