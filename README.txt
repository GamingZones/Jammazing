JAMMAZING - Music Learning Platform README

 1. Prerequisites
- Node.js 18+ (download: nodejs.org)
- Git (optional)

 2. Setup (5 mins)
- cd Jammazing
- npm install


 3. Database Setup
- npm run db:init

Creates SQLite DB at `db/jammazing.db` with all tables.

 4. Run Server
- npm start

- Server: http://localhost:3000
- Open: http://localhost:3000/Pages/home.html

 5. Development
- npm run dev     # nodemon auto-restart
- npm test        # Jest tests
- pm run db:init  # Reset DB

 Test Flow
1. Register @ /Pages/register.html
2. Login @ /Pages/login.html
3. Home → AI Jamming → Record notes
4. Create Quiz → Generate AI questions
5. Profile → Edit/Update

 Structure

Jammazing/
├── Pages/     # HTML pages
├── css/       # Styles
├── js/        # API calls
├── models/    # DB models
├── db/        # SQLite DB
├── server.js  # Express API
└── package.json

Troubleshoot
- Port 3000: busy `taskkill /f /im node.exe`
- DB errors: Delete `db/jammazing.db`, run `npm run db:init`
- npm errors: `npm ci` (clean install)

Features
- AI Quiz Generator
- User Auth (bcrypt/JWT)
- Live Recording
- Real-time Messaging
- Responsive design


Enjoy jamming! 🎵

