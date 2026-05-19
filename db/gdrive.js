/**
 * Google Drive Integration Module
 * Uses file IDs from config/drive-files.json to generate direct download URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const FOLDER_ID = '1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa';
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'drive-files.json');

// Load file ID mappings from config
let fileIdMap = {};

function loadFileIdMap() {
    try {
        const configPath = CONFIG_PATH;
        console.log(`[gdrive] Loading config from: ${configPath}`);
        
        if (!fs.existsSync(configPath)) {
            console.error(`[gdrive] Config file NOT found at: ${configPath}`);
            fileIdMap = {};
            return false;
        }
        
        const content = fs.readFileSync(configPath, 'utf8');
        fileIdMap = JSON.parse(content);
        
        // Count files per category
        const stats = {};
        for (const [category, files] of Object.entries(fileIdMap)) {
            stats[category] = Object.keys(files).length;
        }
        
        console.log(`✅ [gdrive] Loaded file ID mappings: ${JSON.stringify(stats)}`);
        return true;
    } catch (error) {
        console.error(`[gdrive] Error loading config: ${error.message}`);
        fileIdMap = {};
        return false;
    }
}

// Load mappings on startup
loadFileIdMap();

/**
 * Download file from Google Drive using HTTPS with redirect following
 * Returns: Promise<Buffer> - audio file buffer
 */
function downloadFile(fileId) {
    if (!fileId) return Promise.reject(new Error('No file ID provided'));
    
    return new Promise((resolve, reject) => {
        const makeRequest = (url, redirectCount = 0) => {
            if (redirectCount > 10) {
                return reject(new Error('Too many redirects'));
            }
            
            https.get(url, (response) => {
                // Handle redirects
                if (response.statusCode === 303 || response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location;
                    console.log(`[gdrive] Following redirect (${response.statusCode}) to: ${redirectUrl}`);
                    return makeRequest(redirectUrl, redirectCount + 1);
                }
                
                if (response.statusCode !== 200) {
                    return reject(new Error(`Google Drive returned status ${response.statusCode}`));
                }
                
                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    console.log(`[gdrive] Downloaded ${buffer.length} bytes`);
                    resolve(buffer);
                });
                response.on('error', reject);
            }).on('error', reject);
        };
        
        const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        makeRequest(url);
    });
}

/**
 * Get file ID from config by path
 * Example paths: "Piano/1. a0.wav", "Guitar/A2A3.wav", "Drums/Kick/RD_K_1.wav"
 */
function getFileId(filePath) {
    const parts = filePath.split('/');
    const category = parts[0];
    const relativePath = parts.slice(1).join('/');
    
    if (fileIdMap[category] && fileIdMap[category][relativePath]) {
        return fileIdMap[category][relativePath];
    }
    
    // Try exact match
    if (fileIdMap[category]) {
        for (const [fileName, fileId] of Object.entries(fileIdMap[category])) {
            if (fileName.toLowerCase().includes(parts[parts.length - 1].toLowerCase())) {
                return fileId;
            }
        }
    }
    
    return null;
}

/**
 * Get direct Google Drive download URL from file ID
 */
function getDownloadUrl(fileId) {
    if (!fileId || fileId === 'REPLACE_WITH_FILE_ID') {
        return null;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Get file by path and return download URL
 */
function findFileByPath(filePath) {
    const fileId = getFileId(filePath);
    
    if (!fileId) {
        console.warn(`File ID not configured for: ${filePath}`);
        return null;
    }
    
    const downloadUrl = getDownloadUrl(fileId);
    if (!downloadUrl) {
        console.warn(`Invalid file ID for: ${filePath}`);
        return null;
    }
    
    return {
        id: fileId,
        path: filePath,
        url: downloadUrl
    };
}

/**
 * Get all configured audio files
 */
function getAllConfiguredFiles() {
    const files = [];
    for (const [category, categoryFiles] of Object.entries(fileIdMap)) {
        for (const [fileName, fileId] of Object.entries(categoryFiles)) {
            const url = getDownloadUrl(fileId);
            if (url) {
                files.push({
                    category,
                    name: fileName,
                    path: `${category}/${fileName}`,
                    id: fileId,
                    url
                });
            }
        }
    }
    return files;
}

module.exports = {
    FOLDER_ID,
    getFileId,
    getDownloadUrl,
    findFileByPath,
    getAllConfiguredFiles,
    loadFileIdMap,
    downloadFile
};
