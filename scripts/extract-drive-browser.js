/**
 * Google Drive File ID Extractor - Browser Version
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Drive folder: https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa
 * 2. Open Browser DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script into the console
 * 5. Press Enter
 * 6. Copy the output JSON
 * 7. Paste into config/drive-files.json
 */

(async function extractDriveFileIds() {
    console.clear();
    console.log('%c🔍 Google Drive File ID Extractor', 'font-size: 16px; font-weight: bold; color: #0066cc;');
    console.log('%cExtracting file IDs from your Drive folder...', 'color: #666;');
    
    const FOLDER_ID = '1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa';
    const fileMap = {};
    
    // Get auth token from current page
    const authToken = await new Promise((resolve) => {
        // This attempts to get the token from Drive's internal state
        const scripts = Array.from(document.scripts);
        let token = null;
        
        // Try to extract from window object
        if (window.gapi && window.gapi.auth2) {
            try {
                const auth2 = window.gapi.auth2.getAuthInstance();
                if (auth2 && auth2.isSignedIn.get()) {
                    const user = auth2.currentUser.get();
                    token = user.getAuthResponse().id_token;
                }
            } catch (e) {
                console.log('Could not extract auth token');
            }
        }
        resolve(token);
    });
    
    if (!authToken) {
        console.warn('%c⚠️ Could not extract auth token automatically', 'color: orange;');
        console.log('%cManual Method:', 'font-weight: bold;');
        console.log(`
1. Go to: https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa
2. For each file:
   - Right-click → "Get link"
   - Copy the link
   - Extract the ID part (between /d/ and /view)
3. Manually update config/drive-files.json

Or set up API authentication for automatic extraction.
        `);
        return;
    }
    
    async function listFolderContents(folderId, categoryName = '') {
        try {
            const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
            const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=id,name,mimeType&pageSize=1000&access_token=${authToken}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.files) {
                console.warn('Failed to fetch files:', data.error);
                return;
            }
            
            for (const file of data.files) {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    // It's a folder - recurse
                    const subCategory = categoryName ? `${categoryName}/${file.name}` : file.name;
                    await listFolderContents(file.id, subCategory);
                } else if (isAudioFile(file.name)) {
                    // It's an audio file - store it
                    const [category, ...rest] = categoryName.split('/');
                    const subPath = rest.join('/');
                    
                    if (!fileMap[category]) fileMap[category] = {};
                    const fileName = subPath ? `${subPath}/${file.name}` : file.name;
                    fileMap[category][fileName] = file.id;
                    
                    console.log(`✓ ${category}/${fileName}`);
                }
            }
        } catch (error) {
            console.error('Error listing folder:', error);
        }
    }
    
    function isAudioFile(filename) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
        return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
    
    // Start extraction
    console.log('%cExtracting files...', 'color: #0066cc;');
    await listFolderContents(FOLDER_ID);
    
    // Display results
    console.log('%c\n✅ Extraction Complete!\n', 'font-weight: bold; color: green; font-size: 14px;');
    console.log('%cCopy this JSON to config/drive-files.json:', 'font-weight: bold;');
    console.log(JSON.stringify(fileMap, null, 2));
    
    // Also copy to clipboard
    try {
        await navigator.clipboard.writeText(JSON.stringify(fileMap, null, 2));
        console.log('%c✓ Copied to clipboard!', 'color: green;');
    } catch (e) {
        console.log('Could not auto-copy to clipboard. Copy manually from above.');
    }
    
    return fileMap;
})();
