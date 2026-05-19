# 🎵 Quick Setup: Google Drive Audio Files

**Your app is ready! Just need to add audio file IDs.**

Choose your preferred method below:

---

## ⚡ FASTEST: Copy-Paste from Drive (2 minutes)

1. **Open your Drive folder:**
   https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa

2. **Right-click first audio file → "Get link"**
   
   You'll get a URL like:
   ```
   https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6k/view?usp=sharing
   ```
   
   The **file ID** is: `1aB2cD3eF4gH5iJ6k`

3. **Edit `config/drive-files.json`** in your workspace:
   
   ```json
   {
     "Piano": {
       "1. a0.wav": "1aB2cD3eF4gH5iJ6k",
       "2. a#0.wav": "2xY3zW4qR5sT6uV7w",
       ...
     }
   }
   ```

4. **Push to GitHub:**
   ```bash
   git add config/drive-files.json
   git commit -m "Add Google Drive file IDs"
   git push origin main
   ```

5. **Wait 2-3 minutes for Vercel to redeploy**

**Done!** Audio loads from Google Drive 🎉

---

## 🤖 AUTOMATED (if you want it!)

### Option A: Using Node.js Script (requires API key)

```bash
# 1. Get API key from: https://console.cloud.google.com/apis/credentials
#    (Create Credentials → API Key → Google Drive API)

# 2. Set environment variable (Windows):
set GOOGLE_DRIVE_API_KEY=your_api_key_here

# 3. Run extraction:
node scripts/extract-drive-files.js

# This auto-generates config/drive-files.json
```

### Option B: Browser Console (no API key needed!)

```javascript
// 1. Open your Drive folder:
//    https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa

// 2. Press F12 (open DevTools) → Console tab

// 3. Copy-paste this into the console:
// (Then paste the file: scripts/extract-drive-browser.js content)

// 4. Script will:
//    ✓ Extract all file IDs
//    ✓ Copy JSON to clipboard
//    ✓ Paste into config/drive-files.json
```

---

## 📁 File Structure Expected

Your Google Drive should look like:

```
Jammazing Notes/
├── Piano/
│   ├── 1. a0.wav
│   ├── 2. a#0.wav
│   └── ...88 piano notes
├── Guitar/
│   ├── A2A3.wav
│   ├── A3.wav
│   └── ...guitar samples
└── Drums/
    ├── Kick/
    │   ├── RD_K_1.wav
    │   └── ...drum kicks
    ├── Snare/
    │   ├── RD_S_1.wav
    │   └── ...snares
    └── Cymbals/
        ├── Crash/
        ├── Hi Hat/
        └── ...cymbals
```

---

## ✅ Verification

After setting up file IDs:

1. Open: https://jammazing.vercel.app/Pages/ai-jamming.html
2. Check browser console (F12 → Console)
3. You should see: `✓ Piano file loaded`, `✓ Guitar file loaded`, etc.
4. Click Piano/Guitar/Drums buttons → should play sounds!

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "File not configured" | Add file ID to `config/drive-files.json` |
| "Failed to fetch audio" | Check Drive file ID is correct |
| "No sound plays" | Check browser console for errors |
| Vercel shows old version | Wait 3+ minutes, hard refresh (Ctrl+Shift+R) |

---

## 📞 Questions?

Check `GOOGLE_DRIVE_SETUP.md` for more detailed info!
