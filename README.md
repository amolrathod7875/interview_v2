#  AI Interview Platform

An intelligent full-stack web application that helps users prepare for technical interviews through AI-powered mock interviews, quizzes, real-time evaluation, and detailed feedback.

---
## Live Link: [https://interview-v2.vercel.app/](https://interview-v2.vercel.app/)
##  Features

-  **AI Mock Interview** (voice & text based)
-  **AI Evaluation & Scoring**
-  **Interview Quiz Module**
-  **Roadmap Generator**
-  **Resume Upload & Analysis**
-  **Dashboard with Readiness Score**
-  **Interview History Tracking**
-  **Authentication (Firebase)**
-  **File Storage with AWS S3**
-  Real-time interaction & feedback

---

##  Tech Stack

### Frontend
- React
- Tailwind CSS
- Shadcn UI
- Zustand (State Management)
- Axios
- Vite

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Firebase Authentication
- AWS S3 (Resume Storage)
- OpenRouter / AI Models
- WebSockets / Streaming APIs

---

## ️ Environment Variables

### Backend `.env`
```
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string  
FIREBASE_API_KEY=your_key  
AWS_ACCESS_KEY_ID=your_aws_secret_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_s3_region
AWS_BUCKET=your_s3_bucket_name
OCR_API_KEY=your_ocr_api_key
OPEN_ROUTER_API_KEY=your_open_router_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_Storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_firebase_measurment_id
VITE_API_BASE_URL=http://localhost:3000
VITE_BEY_API_KEY=your_beyond_presence_api_key
VITE_BEY_AVATAR_ID=your_beyond_presence_avatar_id
```
## ️ Setup Instructions

### 1️⃣ Clone the Repository

git clone [https://github.com/amolrathod7875/interview_v2.git](https://github.com/amolrathod7875/interview_v2.git)

cd ai-interview-platform  

### 2️⃣ Backend Setup (Express)
```
cd backend  
npm install  
npm run dev  
npm install mongoose
npm install @google/genai
npm install @openrouter/sdk
npm install @aws-sdk/client-s3
```

Backend will run at:  
http://localhost:3000  

### 3️⃣ Frontend Setup (React)

```
cd frontend  
npm install
npm install firebase/auth
npm install react-icons
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add scoreCircle
npx shadcn@latest add separator
npx shadcn@latest add spinner
npx shadcn@latest add textarea
npm run dev  
```

Frontend will run at:  
http://localhost:5173  

---

##  Key Modules

AI Interview → Conducts real-time AI interviews  
Quiz Engine → Skill-based quizzes  
Evaluation Engine → AI scoring, feedback & improvement suggestions  
Resume Analyzer → Uploads and parses resumes
Roadmap Generator → Generated detailed roadmap to given input
Dashboard → User performance & history  
Codex → User DSA Practice Arena
Job Tracker → User Job Tracking Buddy


---

##  Future Enhancements

Company-specific interview simulations  
Coding challenge environment  
Multi-language interview support  
AI career roadmap generator  

---

## Author

Developed by Amol Rathods and team
