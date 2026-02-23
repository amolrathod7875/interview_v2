# 🚀 Deployment Guide - AI Interview Platform

This guide walks you through deploying the AI Interview Platform to production.

---

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/) (for frontend)
- [Render](https://render.com/) / [Railway](https://railway.app/) / [Heroku](https://heroku.com/) (for backend)
- MongoDB Atlas account (or existing MongoDB connection)
- Firebase project configured
- AWS S3 bucket configured
- All required API keys

---

## 🎯 Deployment Architecture

```
Frontend (Vercel) ←→ Backend (Render/Railway) ←→ MongoDB Atlas
                           ↓
                    AWS S3 / Firebase
```

---

## 1️⃣ Backend Deployment

### Option A: Deploy to Render (Recommended)

1. **Create a Render Account** at https://render.com/

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your project

3. **Configure Build Settings**
   ```
   Name: ai-interview-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main (or your production branch)
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   
   Go to "Environment" tab and add:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   MONGO_URI=your_mongodb_atlas_connection_string
   FIREBASE_API_KEY=your_firebase_api_key
   
   # Oracle Cloud Object Storage (recommended - replaces AWS S3)
   ORACLE_ENDPOINT=https://your-namespace.compat.objectstorage.us-ashburn-1.oraclecloud.com
   ORACLE_REGION=us-ashburn-1
   ORACLE_ACCESS_KEY_ID=your_oracle_access_key_id
   ORACLE_SECRET_ACCESS_KEY=your_oracle_secret_access_key
   ORACLE_BUCKET=resumes-ai-interview
   
   # OR - AWS S3 (deprecated - use Oracle Cloud instead)
   # AWS_ACCESS_KEY_ID=your_aws_access_key
   # AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   # AWS_REGION=your_aws_region
   # AWS_BUCKET=your_s3_bucket_name
   
   OCR_API_KEY=your_ocr_api_key
   OPEN_ROUTER_API_KEY=your_openrouter_api_key
   FRONTEND_URL=https://your-frontend-app.vercel.app
   PORT=3000
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your backend
   - Note your backend URL (e.g., `https://ai-interview-backend.onrender.com`)

### Option B: Deploy to Railway

1. **Create Railway Account** at https://railway.app/

2. **New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Service**
   - Select the `backend` directory as root
   - Railway auto-detects Node.js

4. **Add Environment Variables** (same as above)

5. **Generate Domain**
   - Go to Settings → Generate Domain
   - Note your backend URL

### Option C: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   cd backend
   heroku login
   heroku create ai-interview-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set MONGO_URI=your_mongodb_uri
   # ... set all other env vars
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

---

## 2️⃣ Frontend Deployment to Vercel

### Step 1: Prepare Frontend

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

### Step 2: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/
   - Click "Add New" → "Project"

2. **Import Repository**
   - Connect your GitHub account
   - Select your repository
   - Click "Import"

3. **Configure Project Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Set Environment Variables**
   
   Go to "Environment Variables" and add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_PROJECT_ID=your_firebase_project_id
   VITE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_APP_ID=your_firebase_app_id
   VITE_MEASUREMENT_ID=your_firebase_measurement_id
   VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Deploy via CLI (Alternative)

```bash
cd frontend
vercel login
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to `frontend`
# - Deploy!
```

---

## 3️⃣ Update CORS Settings

After deploying both services, update the backend CORS configuration:

1. **Note your Vercel URL**: `https://your-app.vercel.app`

2. **Update Backend Environment Variables**
   
   On Render/Railway/Heroku, update:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```

3. **Verify CORS in backend/main.js**
   
   The CORS configuration should include your production URL:
   ```javascript
   cors({
     origin: [
       "http://localhost:5173",
       "https://interview-v2.vercel.app",
       process.env.FRONTEND_URL,
     ],
     credentials: true,
   })
   ```

---

## 4️⃣ Database Setup (MongoDB Atlas)

If you haven't already:

1. **Create MongoDB Atlas Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster

2. **Whitelist IP Addresses**
   - Network Access → Add IP Address
   - For development: Allow from anywhere (0.0.0.0/0)
   - For production: Add your backend server IPs

3. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Update Backend Environment**
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview?retryWrites=true&w=majority
   ```

---

## 5️⃣ Testing Deployment

### Test Backend
```bash
curl https://your-backend-url.onrender.com/
```

### Test Frontend
1. Visit your Vercel URL
2. Test authentication
3. Test API calls
4. Check browser console for errors

### Common Issues

**CORS Errors**
- Ensure `FRONTEND_URL` is set correctly in backend
- Verify frontend is calling correct backend URL

**Environment Variables Not Loading**
- Restart your services after adding env vars
- Check spelling and formatting
- For Vite, ensure vars start with `VITE_`

**502 Bad Gateway**
- Backend may be sleeping (Render free tier)
- Wait 30 seconds for cold start
- Check backend logs

---

## 6️⃣ Custom Domain (Optional)

### For Frontend (Vercel)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Backend (Render)
1. Go to Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS CNAME record

---

## 7️⃣ Continuous Deployment

Both Vercel and Render/Railway support automatic deployments:

- **Push to main branch** → Auto-deploy to production
- **Push to dev branch** → Create preview deployment (Vercel)
- Monitor deployment status in respective dashboards

---

## 🔐 Security Checklist

- [ ] All environment variables are set
- [ ] MongoDB Atlas IP whitelist is configured
- [ ] Firebase security rules are set
- [ ] AWS S3 bucket policies are configured
- [ ] API keys are not exposed in frontend code
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Vercel/Render)

---

## 📊 Monitoring

### Backend Logs
- **Render**: Dashboard → Logs tab
- **Railway**: Deployment → View Logs
- **Heroku**: `heroku logs --tail`

### Frontend Logs
- **Vercel**: Project → Deployments → Logs
- Browser console for client-side errors

---

## 💰 Cost Estimates

### Free Tier Options
- **Vercel**: Free for personal projects
- **Render**: Free tier with 750 hours/month
- **Railway**: $5 credit/month
- **MongoDB Atlas**: 512MB free tier

### Paid Recommendations
- **Render Pro**: $7/month per service
- **Vercel Pro**: $20/month
- **MongoDB Atlas M10**: $0.08/hour (~$57/month)

---

## 🆘 Troubleshooting

### Backend won't start
1. Check logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Check Node.js version compatibility

### Frontend shows 404 errors
1. Verify `VITE_API_BASE_URL` points to backend
2. Check Network tab in browser DevTools
3. Ensure backend CORS allows frontend origin

### Database connection fails
1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Ensure database user has correct permissions

---

## 📞 Support

If you encounter issues:
1. Check service status pages
2. Review deployment logs
3. Verify environment variables
4. Test locally with production environment variables

---

## 🎉 Success!

Your AI Interview Platform should now be live! 

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com

Share your deployed app and gather feedback!
