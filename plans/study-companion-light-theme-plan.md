# Study Companion - Light Theme Conversion Plan

## Overview

Change the Study Companion from dark theme to light theme with blue accents (similar to the original design).

## Current Dark Theme Colors

```css
--bg-primary: #0f0f0f;        /* Main background */
--bg-secondary: #1a1a1a;     /* Card backgrounds */
--bg-tertiary: #2a2a2a;      /* Hover states, inputs */
--border-color: #2a2a2a;     /* Borders */
--text-primary: #ffffff;     /* Main text */
--text-secondary: #a0a0a0;   /* Secondary text */
```

## Target Light Theme Colors

```css
--bg-primary: #f8fafc;        /* Main background (light gray) */
--bg-secondary: #ffffff;     /* Card backgrounds (white) */
--bg-tertiary: #f1f5f9;      /* Hover states, inputs (slate-100) */
--border-color: #e2e8f0;     /* Borders (slate-200) */
--text-primary: #1e293b;    /* Main text (slate-800) */
--text-secondary: #64748b;   /* Secondary text (slate-500) */
--accent-blue: #3b82f6;      /* Primary accent (blue-500) */
--accent-blue-hover: #2563eb; /* Blue-600 */
```

## Files to Modify

### 1. ThreePaneLayout.jsx
Change:
- `bg-[#0f0f0f]` → `bg-[#f8fafc]`
- `border-[#2a2a2a]` → `border-[#e2e8f0]`

### 2. SourceCard.jsx
Change:
- `bg-[#1a1a1a]` → `bg-white`
- `border-[#2a2a2a]` → `border-[#e2e8f0]`
- `text-white` → `text-[#1e293b]`
- `text-[#a0a0a0]` → `text-[#64748b]`
- Topic tag pills: `bg-[#2a2a2a]` → `bg-[#e0e7ff]` (blue-100), `hover:bg-[#3a3a3a]` → `hover:bg-[#c7d2fe]` (blue-200)

### 3. SourcesPanel.jsx
Change:
- `bg-[#0f0f0f]` → `bg-[#f8fafc]`
- Text colors adjusted for light theme

### 4. ChatPanel.jsx
Change:
- `bg-[#0f0f0f]` → `bg-[#f8fafc]`
- Message bubbles: `bg-[#2a2a2a]` → `bg-blue-50`, `bg-[#1a1a1a]` → `bg-white`
- Text colors for light background

### 5. StudioPanel.jsx
Change:
- `bg-[#0f0f0f]` → `bg-[#f8fafc]`
- Widget backgrounds adjusted

### 6. StudioWidget.jsx
Change:
- `bg-[#1a1a1a]` → `bg-white`
- `border-[#2a2a2a]` → `border-[#e2e8f0]`
- `hover:border-[#3a3a3a]` → `hover:border-blue-300`
- Active state colors adjusted

### 7. ActivityLog.jsx
Change:
- `bg-[#1a1a1a]` → `bg-white`
- Activity item backgrounds adjusted

### 8. SuggestedQuestions.jsx
Change:
- Pill backgrounds: `bg-[#2a2a2a]` → `bg-blue-50`
- Text colors adjusted

## Implementation Steps

1. Update ThreePaneLayout.jsx color scheme
2. Update SourceCard.jsx colors
3. Update SourcesPanel.jsx background
4. Update ChatPanel.jsx colors (messages, input)
5. Update StudioPanel.jsx background
6. Update StudioWidget.jsx colors
7. Update ActivityLog.jsx colors
8. Update SuggestedQuestions.jsx colors
9. Test the interface

## Note

Keep the resize functionality and all other features intact - only change the color scheme.
