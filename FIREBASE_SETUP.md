# Firebase Setup Guide for Jammazing

This guide will help you set up Firebase Realtime Database for Jammazing deployment on Vercel.

## Why Firebase?

SQLite files don't persist on Vercel's serverless platform. Firebase Realtime Database stores data independently, ensuring all user data persists between function invocations.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `jammazing` (or your preferred name)
4. Click **"Continue"**
5. Choose your preferred Google Analytics settings
6. Click **"Create project"** and wait for it to complete

## Step 2: Set Up Realtime Database

1. In Firebase Console, click your project
2. Go to **"Build"** → **"Realtime Database"**
3. Click **"Create Database"**
4. Choose region: **United States** (or closest to your users)
5. Choose security rules: **Start in test mode** (for development)
   - ⚠️ Important: Update rules before production (see below)
6. Click **"Enable"**

## Step 3: Get Firebase Credentials

1. Go to **"Project Settings"** (gear icon in top-left)
2. Click **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. Save the JSON file securely
5. Copy these values from the JSON:
   - `project_id`
   - `private_key`
   - `client_email`
   - `database_url` (will be shown in Realtime Database section)

## Step 4: Configure Environment Variables

### Local Development

1. Copy your credentials into `.env`:

```bash
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NODE_ENV=development
```

⚠️ **Important**: The private key must include literal `\n` characters. Replace actual newlines with `\n`.

### Vercel Deployment

1. Go to Vercel project settings → **"Environment Variables"**
2. Add each Firebase credential as an environment variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (paste the full key with `\n` separators)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_DATABASE_URL`
   - `NODE_ENV` = `production`
3. Click **"Save"** and redeploy

## Step 5: Update Firebase Security Rules (Production)

⚠️ **Critical for security**: Test mode allows anyone to read/write data!

1. In Firebase Console → **"Realtime Database"** → **"Rules"** tab
2. Replace rules with:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).exists()",
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "quizzes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "liveStreams": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notifications": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    ".default": {
      ".read": false,
      ".write": false
    }
  }
}
```

3. Click **"Publish"**

## Step 6: Test Your Setup

### Local Testing

1. Create a `.env` file with your Firebase credentials
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`
4. Try registering a user:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "username": "testuser",
       "password": "password123",
       "accountType": "student",
       "instrument": "Guitar"
     }'
   ```
5. Check Firebase Console → Realtime Database to see the new user data

### Production Testing

1. Deploy to Vercel
2. Visit https://jammazing.vercel.app/Pages/register.html
3. Try registering an account
4. Check Firebase Console to verify user was created

## Data Structure in Firebase

Your database will have this structure:

```
users/
  id_1234.../
    id: "id_1234..."
    firstName: "John"
    lastName: "Doe"
    email: "john@example.com"
    username: "johndoe"
    password: "hashed_password"
    accountType: "student"
    instrument: "Guitar"
    createdAt: "2026-05-19T..."
    updatedAt: "2026-05-19T..."

quizzes/
  id_5678.../
    id: "id_5678..."
    title: "Music Theory 101"
    creatorId: "id_1234..."
    questions: {...}
    totalQuestions: 5
    createdAt: "2026-05-19T..."

liveStreams/
  id_9012.../
    id: "id_9012..."
    streamerId: "id_1234..."
    title: "Live Jam Session"
    viewers: {...}
    chatMessages: {...}
    isLive: true

messages/
  id_3456.../
    id: "id_3456..."
    senderId: "id_1234..."
    recipientId: "id_5678..."
    messageText: "Hello!"
    isRead: false
    createdAt: "2026-05-19T..."
```

## Troubleshooting

### "Firebase initialization failed"

**Cause**: Missing or incorrect environment variables
**Solution**: 
- Verify all env vars are set correctly
- Check that the private key has `\n` separators (not actual newlines)
- In Vercel, restart the deployment after updating env vars

### "Database not initialized" on Vercel

**Cause**: Firebase credentials not accessible in production
**Solution**:
1. Go to Vercel project → Settings → Environment Variables
2. Verify all Firebase variables are present
3. Redeploy: `vercel --prod`
4. Check Vercel function logs for detailed errors

### Users not saving

**Cause**: Database rules preventing writes
**Solution**:
- Check Firebase security rules are not too restrictive
- In development, test mode allows all reads/writes
- Verify user creation endpoint returns 200 (not 503)

### "Permission denied" in Firebase console

**Cause**: Account trying to access data they don't own
**Solution**: This is expected - Firebase rules restrict access to user's own data

## Reference

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Realtime Database Guide](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Jammazing README](../README.md)

## Next Steps

1. ✅ Set up Firebase project and credentials
2. ✅ Configure environment variables
3. ✅ Deploy to Vercel
4. ✅ Test user registration/login
5. Test all other features (quizzes, streams, messaging, etc.)
6. Monitor Firebase usage and optimize as needed
