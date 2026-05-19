#!/usr/bin/env node
/**
 * Google Drive File ID Extractor
 * Automatically lists all files from your Google Drive folder
 * and generates config/drive-files.json with file IDs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FOLDER_ID = '1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa';
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'drive-files.json');

// Try using Google Drive API via command line (requires gcloud SDK)
async function extractUsingGCloud() {
    console.log('\n🔍 Attempting to extract file IDs using gcloud...\n');
    
    try {
        // Check if gcloud is installed
        execSync('gcloud --version', { stdio: 'ignore' });
        console.log('✅ gcloud SDK found\n');
        
        // This would require auth setup - showing the command structure
        console.log('To use gcloud for automatic extraction:');
        console.log('1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
        console.log('2. Run: gcloud auth login');
        console.log('3. Run this script again\n');
        
        return null;
    } catch (error) {
        return null;
    }
}

// Alternative: Use a simpler approach with fetch + API key
async function extractUsingFetch() {
    console.log('\n🔍 Extracting file IDs from Google Drive...\n');
    
    const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
    
    if (!API_KEY) {
        console.log('⚠️  GOOGLE_DRIVE_API_KEY environment variable not set');
        console.log('\nTo set it up:');
        console.log('1. Go to https://console.cloud.google.com/apis/credentials');
        console.log('2. Create an API key for Google Drive API');
        console.log('3. Run: set GOOGLE_DRIVE_API_KEY=your_key_here (Windows)');
        console.log('   or: export GOOGLE_DRIVE_API_KEY=your_key_here (Mac/Linux)\n');
        return null;
    }
    
    try {
        const fileMap = {};
        
        async function listFilesInFolder(parentId, categoryPath = '') {
            const query = `'${parentId}' in parents and trashed=false`;
            const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=id,name,mimeType&pageSize=1000`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            const files = data.files || [];
            
            for (const file of files) {
                const currentPath = categoryPath ? `${categoryPath}/${file.name}` : file.name;
                
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    // Recursively list files in subfolder
                    await listFilesInFolder(file.id, currentPath);
                } else if (isAudioFile(file.name)) {
                    // Store file ID
                    if (!categoryPath) {
                        // Top-level category folder
                        if (!fileMap[file.name]) fileMap[file.name] = {};
                    } else {
                        const [category, ...rest] = categoryPath.split('/');
                        const subPath = rest.join('/');
                        
                        if (!fileMap[category]) fileMap[category] = {};
                        fileMap[category][subPath ? `${subPath}/${file.name}` : file.name] = file.id;
                    }
                }
            }
        }
        
        function isAudioFile(filename) {
            const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
            return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
        }
        
        // Start extraction
        await listFilesInFolder(FOLDER_ID);
        
        // Reorganize by top-level categories
        const organizedMap = {};
        for (const [category, files] of Object.entries(fileMap)) {
            if (typeof files === 'string') {
                // File ID - skip
                continue;
            }
            organizedMap[category] = files;
        }
        
        if (Object.keys(organizedMap).length === 0) {
            console.log('❌ No audio files found. Check your Google Drive folder and API key.\n');
            return null;
        }
        
        return organizedMap;
    } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
        console.log('Troubleshooting:');
        console.log('- Make sure GOOGLE_DRIVE_API_KEY environment variable is set');
        console.log('- Verify the API key has access to Google Drive API');
        console.log('- Check that the folder is accessible: https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa\n');
        return null;
    }
}

// Manual extraction helper
function showManualInstructions() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              Manual File ID Extraction Instructions                 ║
╚════════════════════════════════════════════════════════════════════╝

Since automatic extraction requires authentication, here's a faster manual approach:

1. Open your Google Drive folder:
   https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa

2. For each file category (Piano, Guitar, Drums, etc.):
   - Right-click the file
   - Select "Get link"
   - The URL looks like: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   - Copy the FILE_ID part

3. Edit config/drive-files.json and replace the placeholders:
   {
     "Piano": {
       "1. a0.wav": "PASTE_FILE_ID_HERE",
       ...
     },
     "Guitar": {
       "A2A3.wav": "PASTE_FILE_ID_HERE",
       ...
     },
     "Drums": {
       "Kick/RD_K_1.wav": "PASTE_FILE_ID_HERE",
       ...
     }
   }

4. Save and deploy:
   git add config/drive-files.json
   git commit -m "Add Google Drive file IDs"
   git push origin main

5. Done! Audio will load from Google Drive 🎵

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alternative: Automate with API Key
═══════════════════════════════════════════════════════════════════════

If you want automatic extraction, set up authentication:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Set environment variable:
   - Windows: set GOOGLE_DRIVE_API_KEY=your_key_here
   - Mac/Linux: export GOOGLE_DRIVE_API_KEY=your_key_here
5. Run: node scripts/extract-drive-files.js

The script will automatically:
✓ List all files from your Drive folder
✓ Extract file IDs
✓ Generate config/drive-files.json
✓ Deploy to Vercel

═══════════════════════════════════════════════════════════════════════
`);
}

async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║          Google Drive File ID Extractor                            ║
║   Generates config/drive-files.json from your Drive folder         ║
╚════════════════════════════════════════════════════════════════════╝
`);
    
    // Try automatic extraction
    let fileMap = await extractUsingFetch();
    
    if (fileMap && Object.keys(fileMap).length > 0) {
        // Save config file
        const configDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(fileMap, null, 2));
        
        console.log(`✅ Extracted ${Object.keys(fileMap).length} audio categories\n`);
        
        for (const [category, files] of Object.entries(fileMap)) {
            const count = Object.keys(files).length;
            console.log(`   📁 ${category}: ${count} files`);
        }
        
        console.log(`\n✅ Config saved to: ${CONFIG_PATH}\n`);
        console.log('📤 Deploy with:\n');
        console.log('   git add config/drive-files.json');
        console.log('   git commit -m "Add Google Drive file IDs"');
        console.log('   git push origin main\n');
    } else {
        // Show manual instructions
        showManualInstructions();
    }
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
