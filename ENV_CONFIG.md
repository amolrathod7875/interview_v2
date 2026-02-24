# Environment Variables Configuration

##  Backend Environment Variables (.env)

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview?retryWrites=true&w=majority

# Firebase
FIREBASE_API_KEY=your_firebase_api_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET=your-s3-bucket-name

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPEN_ROUTER_API_KEY=your_openrouter_api_key
OCR_API_KEY=your_ocr_space_api_key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-app.vercel.app

# Server Configuration
PORT=3000
NODE_ENV=production
```

---

##  Frontend Environment Variables (.env)

Create a `.env` file in the `frontend/` directory:

```env
# Backend API
VITE_API_BASE_URL=https://your-backend-url.onrender.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_PROJECT_ID=your-firebase-project-id
VITE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_measurement_id

# VAPI (Voice AI)
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
```

---

##  How to Obtain API Keys

### MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string

### Firebase
1. Go to https://console.firebase.google.com/
2. Create or select your project
3. Project Settings → General → Your apps
4. Copy all configuration values

### AWS S3
1. Go to https://aws.amazon.com/
2. IAM → Users → Create User
3. Attach policy: `AmazonS3FullAccess`
4. Create access key
5. Create an S3 bucket in your desired region

### Google Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create API key

### OpenRouter
1. Go to https://openrouter.ai/
2. Sign up and get API key from dashboard

### OCR Space
1. Go to https://ocr.space/ocrapi
2. Sign up for free API key

### VAPI (Voice AI)
1. Go to https://vapi.ai/
2. Sign up and get public key from dashboard

---

##  For Production Deployment

### Vercel (Frontend)
Set environment variables in: **Project Settings → Environment Variables**

### Render/Railway (Backend)
Set environment variables in: **Environment tab** or **Variables section**

### Important Notes:
-  Never commit `.env` files to Git
-  Use different keys for development and production
-  Keep your API keys secure
-  Rotate keys regularly
-  Use environment-specific values (dev, staging, prod)

---

##  Verification Checklist

Before deploying, ensure:
- [ ] All required environment variables are set
- [ ] MongoDB connection string is correct and accessible
- [ ] Firebase configuration is complete
- [ ] AWS S3 credentials have proper permissions
- [ ] API keys are valid and not expired
- [ ] Frontend URL in backend matches actual deployment URL
- [ ] Backend URL in frontend matches actual deployment URL
- [ ] All sensitive data is in environment variables, not hardcoded

---

##  Security Best Practices

1. **Never expose** API keys in client-side code
2. Use **VITE_** prefix for Vite environment variables
3. Set up **Firebase Security Rules**
4. Configure **S3 Bucket Policies** properly
5. Enable **MongoDB IP Whitelisting**
6. Use **HTTPS** for all production endpoints
7. Implement **rate limiting** on API endpoints
8. Store secrets in platform-specific secret managers when possible
