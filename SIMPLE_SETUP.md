# Simple File ID Setup (No API Keys Needed!)

**The easiest way:** Manually get file IDs one at a time.

## Step 1: Get ONE File ID

1. Open your Drive folder:
   https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa

2. Find **Piano folder** → open it

3. Right-click **"1. a0.wav"** → **"Get link"**

4. Copy the link. It looks like:
   ```
   https://drive.google.com/file/d/ABC123XYZ789/view?usp=sharing
   ```

5. Extract just the ID part: `ABC123XYZ789`

## Step 2: Add to Config

1. Open `config/drive-files.json` in VS Code

2. Find this line:
   ```json
   "1. a0.wav": "REPLACE_ME",
   ```

3. Replace `REPLACE_ME` with your file ID:
   ```json
   "1. a0.wav": "ABC123XYZ789",
   ```

4. Save the file

## Step 3: Test

1. Push to GitHub:
   ```bash
   git add config/drive-files.json
   git commit -m "Add first piano file ID"
   git push origin main
   ```

2. Wait 2-3 minutes for Vercel

3. Open: https://jammazing.vercel.app/Pages/ai-jamming.html

4. Click Piano button → should hear sound! 🎵

## Step 4: Repeat

Once the first one works, keep adding more file IDs the same way!

You don't need ALL of them at once. Add them as you test.

---

**Quick Copy-Paste List:**

Piano: Need 88 files (a0.wav through c8.wav)
Guitar: Need 16 files (A2A3.wav, A3.wav, etc.)
Drums: Need ~100+ files (across Kick, Snare, Cymbals, Toms, Percussion folders)

But you can start with just a few and add more later!
