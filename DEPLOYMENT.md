# Jammazing Deployment Guide

This guide covers deploying Jammazing to production using Netlify for the frontend and Railway/Render for the backend.

## Architecture

```
Frontend (Netlify) → Backend (Railway/Render)
   ↓ (Static files)    ↓ (API + WebSocket)
   Static HTML/CSS/JS  Node.js + Express + SQLite
```

---

## Part 1: Deploy Backend (Railway or Render)

### Option 1A: Railway.app

1. **Create Railway account** at https://railway.app
2. **Connect GitHub** - Go to Dashboard → Create → GitHub Repo
3. **In your repo root**, create `railway.json`:
   ```json
   {
     "build": "npm install",
     "start": "npm start"
   }
   ```
4. **Set Environment Variables** in Railway dashboard:
   ```
   PORT=3000
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key-here-use-strong-value
   DATABASE_URL=db/jammazing.db
   ```
5. **Copy your backend URL** (e.g., `https://jammazing-prod.railway.app`)

### Option 1B: Render.com

1. **Create Render account** at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings:**
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Environment Variables:**
   ```
   PORT=3000
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key-here
   DATABASE_URL=db/jammazing.db
   ```
5. **Copy your backend URL** (e.g., `https://jammazing-prod.onrender.com`)

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Prepare Code

Update `js/api.js` to use the config:
```javascript
import { API_BASE_URL, SOCKET_URL } from './config.js';
// Replace all references to hardcoded 'http://localhost:3000'
```

### Step 2: Create Netlify Account

1. Go to https://app.netlify.com
2. Sign up with GitHub

### Step 3: Connect Repository

1. Click "New site from Git"
2. Connect your GitHub repo (Jammazing)
3. Configure build settings:
   - **Build command:** `echo 'No build needed'` (or leave empty)
   - **Publish directory:** `.` (root directory)

### Step 4: Set Environment Variables

In Netlify dashboard → Site settings → Build & deploy → Environment:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-url.onrender.com
```

(Replace with your actual backend URL from Railway/Render)

### Step 5: Deploy

1. Commit and push to GitHub
2. Netlify auto-deploys
3. Your site URL: `https://your-site.netlify.app`

---

## Part 3: Post-Deployment Setup

### 1. Update CORS in Backend

Edit `server.js` to allow Netlify domain:

```javascript
const io = socketIO(server, {
    cors: { 
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://your-site.netlify.app"
        ], 
        methods: ["GET", "POST"] 
    }
});
```

### 2. Test Endpoints

- **Frontend:** https://your-site.netlify.app/Pages/login.html
- **Backend API:** https://your-backend-url/api/users (should show users)
- **WebSocket:** Test real-time chat on your app

### 3. Database Persistence (Important!)

**SQLite limitation:** File-based DB won't persist across dyno restarts on Railway/Render.

**Solutions:**
- **Option A:** Accept data loss on restart (fine for dev)
- **Option B:** Migrate to PostgreSQL (recommended for production)
- **Option C:** Use Supabase (PostgreSQL + auth + hosted)

---

## Part 4: Advanced - Migrate to PostgreSQL

If you want persistent database:

1. **Create Supabase account:** https://supabase.com
2. **Create a new project** → Copy connection string
3. **Install PostgreSQL driver:**
   ```bash
   npm install pg
   ```
4. **Update `db/database.js`** to use PostgreSQL instead of SQLite

Alternative: Use Railway/Render's PostgreSQL addon

---

## Local Development

### Run Locally

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Start backend (Terminal 1)
npm start

# Frontend already runs on http://localhost:3000/Pages/home.html
```

### Environment for Local Dev

Create `.env`:
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
JWT_SECRET=dev-secret-key
```

---

## Troubleshooting

### WebSocket Connection Fails
- Check CORS origins in `server.js`
- Verify backend URL in frontend env variables
- Check browser console for connection errors

### API Calls Return 404
- Verify backend is running and accessible
- Check `REACT_APP_API_URL` is correct
- Ensure `/api/` prefix is used correctly

### Database Empty After Restart
- This is expected with SQLite on serverless
- Run `npm run db:init` to reset
- **Solution:** Migrate to PostgreSQL for production

### Port Already in Use
```bash
taskkill /f /im node.exe  # Windows
lsof -ti:3000 | xargs kill # Mac/Linux
```

---

## Deployment Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Netlify
- [ ] Environment variables set correctly
- [ ] Backend URL added to Netlify env vars
- [ ] CORS origins updated in server.js
- [ ] Database initialized on backend
- [ ] Login page loads: `https://your-site.netlify.app/Pages/login.html`
- [ ] API test works: Backend responds to requests
- [ ] WebSocket works: Real-time chat functional

---

## Next Steps

1. **Monitor Logs:**
   - Netlify: Deploys tab
   - Railway/Render: Logs section

2. **Set Up Custom Domain:**
   - Netlify: Domain settings
   - Railway/Render: Custom domain

3. **Backup Database:**
   - Export SQLite before migration
   - Set up automated backups for PostgreSQL

4. **Performance:**
   - Enable CDN caching in Netlify
   - Optimize image sizes
   - Monitor WebSocket connections

---

## Support

- Netlify docs: https://docs.netlify.com
- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Express docs: https://expressjs.com
