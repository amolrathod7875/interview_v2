# Bug Report - Interview.io Project

## Summary
This document contains all bugs identified during the code review of both backend and frontend projects.

---

## Backend Bugs

### 1. Configuration Bug - S3 Client Invalid Parameter
**File:** `backend/config/s3.js` (Line 7)
**Issue:** `acl: "public-read"` is not a valid S3Client configuration parameter. The `acl` should be set on individual PutObjectCommand requests, not on the client.
**Severity:** High - Will cause runtime errors
```javascript
// BUGGY:
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  acl: "public-read",  // ❌ Invalid parameter
  credentials: { ... }
})
```

---

### 2. Model Bug - Typo in Required Field
**File:** `backend/models/quizModel.js` (Line 7)
**Issue:** Typo `erquired` should be `required`
**Severity:** Medium - Schema validation issue
```javascript
// BUGGY:
isCompleted: {type: Boolean, erquired: true}  // ❌ Typo
```

---

### 3. Middleware Bug - Cookie Parser Not Applied
**File:** `backend/middlewares/githubAuth.js` (Line 7)
**Issue:** `req.cookies` is being accessed but cookie-parser middleware is not being used in this middleware. The main app has it, but this specific middleware tries to access cookies directly which would be undefined.
**Severity:** Medium - GitHub authentication will fail for cookie-based auth
```javascript
// BUGGY:
const sessionId = authHeader?.replace('Bearer ', '') || req.cookies?.gh_session;  // ❌ req.cookies undefined
```

---

### 4. Route Bug - Missing Return Statement
**File:** `backend/routes/interviewRoutes.js` (Line 64)
**Issue:** Potential division by zero - `score/count` when count is 0 results in NaN
**Severity:** Medium - Returns NaN to client

---

### 5. Route Bug - Missing Return After Response
**File:** `backend/routes/resultRoutes.js` (Lines 83-90)
**Issue:** Not returning after sending 404 response - code will continue executing
**Severity:** Medium - Potential memory leak / unexpected behavior

---

### 6. Route Bug - Wrong MongoDB Method
**File:** `backend/routes/quizRoute.js` (Line 107)
**Issue:** Using `insertOne` instead of `insertMany` - incorrect method name (should be `create` or use `insertMany`)
**Severity:** Medium - Query will fail

---

### 7. Route Bug - Schema Field Mismatch
**File:** `backend/routes/quizRoute.js` (Line 103)
**Issue:** Storing `interviewId` in quizAnswerModel but the schema doesn't have that field defined
**Severity:** Low - Data won't be stored correctly

---

### 8. Route Bug - Potential Crash on Empty Results
**File:** `backend/routes/buildRoutes.js` (Line 17)
**Issue:** `result.ParsedResults[0].ParsedText` - if ParsedResults is undefined or empty, will crash
**Severity:** High - Server crash possible

---

### 9. API Endpoint Typo
**File:** `backend/routes/codexCoreRoutes.js` (Line 190)
**Issue:** Looking for CoreProblem but the route seems to be for core problems - potential confusion with Problem model
**Severity:** Low - Logic issue

---

### 10. Missing Error Handling
**File:** `backend/services/oracleRoadmapCache.js`
**Issue:** Several functions don't handle missing environment variables gracefully
**Severity:** Medium - Service may fail silently

---

## Frontend Bugs

### 1. API URL Processing Bug
**File:** `frontend/src/components/api.js` (Line 5)
**Issue:** URL cleaning logic could fail if API base URL is not properly formatted
```javascript
// Potential edge case:
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+/, "").replace(/\/api$/, "");
```
**Severity:** Low - URL handling edge cases

---

### 2. Login Component - Missing Error State Display
**File:** `frontend/src/components/login.jsx`
**Issue:** Login errors are logged to console but not displayed to user - poor UX
**Severity:** Medium - User doesn't see error messages

---

### 3. Signup Component - Missing Error State Display  
**File:** `frontend/src/components/signup.jsx`
**Issue:** Signup errors are logged to console but not displayed to user - poor UX
**Severity:** Medium - User doesn't see error messages

---

### 4. API Base URL Inconsistency
**File:** `frontend/src/components/signup.jsx` (Line 11)
**Issue:** Uses `VITE_API_BASE_URL` directly without the same URL cleaning as other files
```javascript
// Inconsistent:
const API = import.meta.env.VITE_API_BASE_URL  // No URL cleaning
// vs other files:
const API = RAW_API.replace(/\/+/, "").replace(/\/api$/, "")
```
**Severity:** Low - Potential URL issues

---

### 5. Interview Component - Potential Race Condition
**File:** `frontend/src/components/aiInterview.jsx`
**Issue:** The `hangUpRef` synchronization with useEffect could have timing issues
**Severity:** Low - Edge case timing issue

---

### 6. Interview Component - API Path Inconsistency
**File:** `frontend/src/components/aiInterview.jsx` (Line 201)
**Issue:** Uses `/api/beyondpresence/create-session` - double "api" prefix issue
```javascript
// Potential issue:
fetch(`${API}/api/beyondpresence/create-session`  // Double api?
```
**Severity:** Low - May cause 404 if backend route doesn't match

---

### 7. BeyondPresence Avatar - Memory Leak Potential
**File:** `frontend/src/components/BeyondPresenceAvatar.jsx`
**Issue:** Audio element created dynamically but not always cleaned up properly in all error paths
**Severity:** Medium - Memory leak possible

---

### 8. Body Language Monitor - Model Loading Error Handling
**File:** `frontend/src/components/BodyLanguageMonitor.jsx` (Lines 360-399)
**Issue:** Model loading failures don't stop the component from rendering - shows generic error
**Severity:** Low - UX issue

---

### 9. Audio Analyzer - Context Not Always Closed
**File:** `frontend/src/hooks/useAudioAnalyzer.js` (Lines 151-170)
**Issue:** Cleanup may not always run in all component unmount scenarios
**Severity:** Low - Minor resource leak

---

### 10. Missing Prop Types / TypeScript
**Files:** Multiple frontend components
**Issue:** No prop type validation - runtime errors possible with incorrect props
**Severity:** Low - Code maintainability

---

## Summary Statistics

| Category | Count |
|----------|-------|
| High Severity | 2 |
| Medium Severity | 10 |
| Low Severity | 8 |
| **Total Bugs** | **20** |

---

## Recommendations

1. **Priority Fixes (High):**
   - Fix S3 client configuration
   - Fix buildRoutes ParsedResults crash
   - Fix quizRoute insertOne method

2. **Quick Fixes (Medium):**
   - Fix quizModel typo
   - Add error display to login/signup
   - Fix interviewRoutes division by zero
   - Fix resultRoutes missing return

3. **Cleanup (Low):**
   - Standardize API URL handling
   - Add proper TypeScript/types
   - Improve error handling messages
