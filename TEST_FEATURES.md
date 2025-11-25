# Test All New Features

## Prerequisites
1. Run the SQL schema:
```bash
# In Supabase SQL Editor, run:
# ADD_AUTH_BOOKMARKS_SCHEMA.sql
```

2. Restart dev server:
```bash
npm run dev
```

## Test Checklist

### ✅ Homepage
- [ ] Visit http://localhost:3000
- [ ] See search bar in header
- [ ] See theme toggle (moon/sun icon)
- [ ] See "Login" button
- [ ] See list of stories
- [ ] Click a story

### ✅ Story Detail Page
- [ ] Story title and content displayed
- [ ] Source name and credibility score shown
- [ ] Bias indicator visible
- [ ] Bookmark button present
- [ ] 8 AI feature buttons visible:
  - 📝 AI Summary
  - 👶 Explain Like I'm 5
  - 😊 Sentiment Analysis
  - ⚖️ Bias Detection
  - ✓ Fact Check
  - 📚 Historical Context
  - 🎯 Impact Analysis
  - ⏱️ Timeline
- [ ] Click an AI feature button
- [ ] Wait for AI response
- [ ] Response displays correctly

### ✅ Search
- [ ] Type in search bar
- [ ] Press Enter
- [ ] Redirects to /search?q=...
- [ ] Results displayed
- [ ] Click a result

### ✅ Theme Toggle
- [ ] Click moon icon (switch to dark)
- [ ] Page turns dark
- [ ] Click sun icon (switch to light)
- [ ] Page turns light
- [ ] Refresh page - theme persists

### ✅ Authentication
- [ ] Click "Login" in header
- [ ] Redirects to /auth/login
- [ ] Click "Sign up" link
- [ ] Enter email and password
- [ ] Click "Sign Up"
- [ ] Redirects to /dashboard
- [ ] See profile email
- [ ] See bookmarks count
- [ ] Click "Sign Out"
- [ ] Redirects to homepage

### ✅ Bookmarks
- [ ] Login first
- [ ] Go to any story
- [ ] Click bookmark button (📑)
- [ ] Icon changes to 🔖
- [ ] Go to /dashboard
- [ ] Bookmark count increased
- [ ] Click bookmark again to remove

### ✅ Dashboard
- [ ] Visit /dashboard (must be logged in)
- [ ] See profile card with email
- [ ] See bookmarks count
- [ ] See reading history count
- [ ] Click "Browse Stories"
- [ ] Returns to homepage

## Quick Test URLs

```
Homepage:        http://localhost:3000
Search:          http://localhost:3000/search?q=nigeria
Login:           http://localhost:3000/auth/login
Signup:          http://localhost:3000/auth/signup
Dashboard:       http://localhost:3000/dashboard
Story (example): http://localhost:3000/story/[any-story-id]
```

## Expected Behavior

### AI Features
- First click: Generates response (2-5 seconds)
- Second click: Instant (cached)
- Different features: Different responses

### Authentication
- Unauthenticated: Can browse, search, view stories
- Authenticated: Can bookmark, access dashboard
- Protected routes: Redirect to login

### Search
- Empty query: Shows message
- With query: Shows matching stories
- No results: Shows "No stories found"

### Theme
- Persists across page navigation
- Persists after browser refresh
- Applies to all pages

## Troubleshooting

### AI Features Not Working
- Check API keys in .env
- Check browser console for errors
- Verify ai_explanations table exists

### Authentication Not Working
- Run the SQL schema first
- Check Supabase Auth is enabled
- Verify user_profiles table exists

### Bookmarks Not Working
- Must be logged in
- Run the SQL schema first
- Check bookmarks table exists

### Search Not Working
- Check stories exist in database
- Verify search query is not empty
- Check browser console for errors
