# 🚀 Jammazing - Quick Deploy to Netlify

This is your step-by-step guide to deploy Jammazing frontend to Netlify with backend on Railway/Render.

## 3 Simple Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/jammazing.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend (Choose One)

#### **Railway (Recommended - Faster)**
1. Go to https://railway.app
2. Click "Create" → "GitHub Repo" → Select Jammazing
3. In Railway dashboard, set these Environment Variables:
   ```
   PORT=3000
   NODE_ENV=production
   JWT_SECRET=generate-random-string-here
   DATABASE_URL=db/jammazing.db
   ```
4. Copy your backend URL (looks like `https://jammazing-prod.railway.app`)

#### **Render Alternative**
1. Go to https://render.com
2. "New Web Service" → Connect GitHub
3. Settings:
   - Build: `npm install`
   - Start: `npm start`
   - Plan: Free (auto-sleeps)
4. Add Environment Variables (same as above)
5. Copy your backend URL

### Step 3: Deploy Frontend to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub → Select Jammazing
4. Build settings:
   - Build command: (leave empty or `npm run build`)
   - Publish directory: `.` (root)
   - Click Deploy Site

5. **Set Environment Variables:**
   - Go to Site settings → Build & deploy → Environment
   - Add variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     REACT_APP_SOCKET_URL=https://your-backend-url.railway.app
     ```
     (Replace with your actual Railway/Render URL)

6. **Trigger new deploy:**
   - Go to Deploys tab → Trigger deploy

## ✅ Verify It Works

- **Frontend:** https://your-site.netlify.app/Pages/login.html
- **Register:** Create an account
- **Login:** Use your credentials
- **Real-time:** Send messages to test WebSocket
- **Backend logs:** Check Railway/Render dashboard

## 🔐 Important: Update CORS

Edit `server.js` line ~32 and add your Netlify domain:

```javascript
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-site.netlify.app',      // ← Add this
    'https://your-backend.railway.app'   // ← Add this if needed
];
```

Then commit and push:
```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

## 🎯 Done!

Your app is now live at: `https://your-site.netlify.app`

---

## Troubleshooting

**API calls not working?**
- Check Netlify env vars are set correctly
- Check backend is running (Railway/Render dashboard)
- Check CORS in server.js includes your Netlify domain

**Real-time chat not working?**
- Same CORS issues as above
- Check WebSocket connection in browser DevTools Console

**Database empty?**
- SQLite won't persist on Railway/Render free tier
- Recommend migrating to PostgreSQL for production (see DEPLOYMENT.md)
- For testing: Re-run `npm run db:init` in backend

**"Cannot find module"?**
- Ensure you ran `npm install` locally
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## 📚 Full Guide

See `DEPLOYMENT.md` for:
- Detailed setup instructions
- PostgreSQL migration for production
- Custom domain setup
- Performance optimization
- Backup strategies

## Support Links

- Netlify: https://docs.netlify.com
- Railway: https://docs.railway.app
- Render: https://render.com/docs
