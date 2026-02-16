# Study Companion - Comprehensive Fix Plan

## Overview

This plan addresses three main areas for the Study Companion:
1. Chat functionality and UI integration
2. Backend endpoints for new studio widgets
3. File upload and source management improvements

---

## Part 1: Chat Functionality & UI Integration

### Issues to Fix:
1. Chat messages not properly integrated with UI
2. Missing error handling in chat
3. Activity log not updating correctly

### Frontend Changes (`StudyPage.jsx`):

1. **Fix Chat Integration**:
   - Ensure chat messages display properly in the center panel
   - Add proper error handling and display error messages
   - Fix the chat input handling

2. **Activity Log Integration**:
   - Properly track and display background tasks
   - Add status updates for: file upload, summary generation, audio generation

---

## Part 2: Backend Endpoints for Studio Widgets

### Current Endpoints:
- `POST /api/study/process` - File upload + generate summary/flashcards/quiz
- `POST /api/study/quiz` - Regenerate quiz with custom count
- `POST /api/study/chat` - Q&A about study material
- `POST /api/study/audio` - Generate audio overview

### New Endpoints Needed:

#### 1. Mind Map (`POST /api/study/mindmap`)
```javascript
// Request: { text, topics[] }
// Response: { nodes: [], edges: [] } for visualization
```

#### 2. Reports (`POST /api/study/report`)
```javascript
// Request: { text, reportType: 'summary' | 'detailed' | 'outline' }
// Response: { title, sections: [] }
```

#### 3. Infographic (`POST /api/study/infographic`)
```javascript
// Request: { text, type: 'timeline' | 'comparison' | 'hierarchy' }
// Response: { elements: [], description: '' }
```

#### 4. Slide Deck (`POST /api/study/slides`)
```javascript
// Request: { text, slideCount: 5-10 }
// Response: { slides: [{ title, content, bulletPoints: [] }] }
```

#### 5. Data Table (`POST /api/study/datatable`)
```javascript
// Request: { text }
// Response: { headers: [], rows: [], summary: '' }
```

---

## Part 3: File Upload & Source Management

### Issues to Fix:
1. File uploader styling needs to match light theme
2. Multiple file handling
3. Source card data structure

### Frontend Changes:

#### 1. Update FileUploader (`FileUploader.jsx`)
- Update styling for light theme:
  - Background: `bg-white`
  - Border: `border-[#e2e8f0]`
  - Hover: `hover:border-[#3b82f6]`
  - Text colors adjusted

#### 2. Source Card Data
- Properly parse and display topics from backend
- Add file preview support
- Handle multiple sources

---

## Implementation Order

### Phase 1: Quick Fixes (1-2 hours)
1. Update FileUploader styling
2. Fix chat integration in StudyPage
3. Test existing functionality

### Phase 2: Backend Extensions (2-3 hours)
1. Add new endpoints for missing widgets
2. Add frontend stubs for unimplemented widgets

### Phase 3: Integration (1-2 hours)
1. Connect activity log with backend tasks
2. Add loading states
3. Test all functionality

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/components/study/FileUploader.jsx` | Update light theme styling |
| `frontend/src/pages/StudyPage.jsx` | Fix chat, activity log |
| `backend/routes/studyRoutes.js` | Add new endpoints |
| `backend/services/studyAI.service.js` | Add new AI generation functions |

---

## New API Endpoints Summary

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `/api/study/mindmap` | Generate mind map data | Medium |
| `/api/study/report` | Generate study reports | Medium |
| `/api/study/infographic` | Generate infographic data | Low |
| `/api/study/slides` | Generate slide deck | Medium |
| `/api/study/datatable` | Extract tabular data | Low |

---

## Notes

- Keep existing functionality working
- Use consistent JSON response format
- Add proper error handling
- Maintain backward compatibility with existing API calls
