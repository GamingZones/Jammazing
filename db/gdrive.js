/**
 * Google Drive Integration Module
 * Uses file IDs from config/drive-files.json to generate direct download URLs
 */

const fs = require('fs');
const path = require('path');

const FOLDER_ID = '1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa';
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'drive-files.json');

// Load file ID mappings from config
let fileIdMap = {};

function loadFileIdMap() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf8');
            fileIdMap = JSON.parse(content);
            console.log('✅ Loaded Google Drive file ID mappings');
        } else {
            console.warn('⚠️ Config file not found at:', CONFIG_PATH);
            fileIdMap = {};
        }
    } catch (error) {
        console.error('Error loading file ID config:', error);
        fileIdMap = {};
    }
}

// Load mappings on startup
loadFileIdMap();

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
    loadFileIdMap
};
