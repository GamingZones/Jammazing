# Setting Up Google Drive Audio Files

## Quick Start

1. **Get the helper script running:**
   ```bash
   node scripts/setup-drive-files.js
   ```

2. **For each audio file in your Google Drive:**
   - Right-click the file
   - Select "Get link"
   - Copy the link
   - Extract the file ID (between `/d/` and `/view`)
   
   Example:
   ```
   Link:   https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6k/view?usp=sharing
   ID:     1aB2cD3eF4gH5iJ6k
   ```

3. **Edit `config/drive-files.json`:**
   Replace `REPLACE_WITH_FILE_ID` with actual IDs
   
   ```json
   {
     "Piano": {
       "1. a0.wav": "1aB2cD3eF4gH5iJ6k",
       "2. a#0.wav": "2xY3zW4qR5sT6uV7w",
       "3. b0.wav": "3mN4oP5qR6sT7uV8w"
     },
     "Guitar": {
       "A2A3.wav": "4aB5cD6eF7gH8iJ9k"
     },
     "Drums": {
       "Kick/RD_K_1.wav": "5xY6zW7qR8sT9uV0w"
     }
   }
   ```

4. **Test:**
   - Open https://jammazing.vercel.app/Pages/ai-jamming.html
   - Audio should load from Google Drive!

## How It Works

1. Frontend requests audio file: `/api/drive/file?path=Piano/1.%20a0.wav`
2. Backend looks up file ID from `config/drive-files.json`
3. Returns Google Drive direct download URL
4. Frontend fetches and decodes the audio
5. Web Audio API plays the sound

## Troubleshooting

**Error: "File not configured in Google Drive"**
- The file ID isn't in `config/drive-files.json`
- Add it by getting the file link and extracting the ID

**Error: "Failed to fetch audio"**
- The Google Drive file ID might be invalid
- Double-check the file ID is correct
- Make sure the file is accessible in your Drive

**No sound playing**
- Check browser console for errors
- Verify file IDs are in the config
- Ensure audio files are in your Google Drive folder

## Batch Processing (Optional)

If you have many files, you can:
1. List all files in Google Drive
2. Get their IDs programmatically using Google Drive API (with credentials)
3. Generate the config file automatically

Contact if you need help setting up batch processing!
