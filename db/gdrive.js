/**
 * Google Drive Integration Module
 * Lists and retrieves files from a Google Drive folder
 */

const FOLDER_ID = '1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa';
const API_KEY = process.env.GOOGLE_DRIVE_API_KEY || 'AIzaSyCHF_PlGlPkq6S-V-QV7VJUxNT2xJhN8QE'; // Free tier key

/**
 * Get all files and folders from a Google Drive folder
 * @param {string} folderId - The Google Drive folder ID
 * @returns {Promise<Array>} Array of file/folder objects
 */
async function listFilesInFolder(folderId) {
  try {
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=id,name,mimeType,webViewLink,webContentLink`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Drive API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return [];
  }
}

/**
 * Get direct download URL for a Google Drive file
 * @param {string} fileId - The file ID from Google Drive
 * @returns {string} Direct download/view URL
 */
function getFileUrl(fileId) {
  // For audio files, use preview URL
  return `https://drive.google.com/uc?export=preview&id=${fileId}`;
}

/**
 * Get audio files from specific categories
 * @returns {Promise<Object>} Organized by category (Piano, Guitar, Drums, etc.)
 */
async function getAudioFiles() {
  try {
    const rootFiles = await listFilesInFolder(FOLDER_ID);
    const categories = {};

    // Get folders and their contents
    for (const item of rootFiles) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        // This is a folder (category like "Piano", "Guitar")
        const subFiles = await listFilesInFolder(item.id);
        const audioFiles = subFiles
          .filter(f => isAudioFile(f.name))
          .map(f => ({
            id: f.id,
            name: f.name,
            category: item.name,
            url: `https://drive.google.com/uc?export=download&id=${f.id}`,
            previewUrl: getFileUrl(f.id)
          }));

        if (audioFiles.length > 0) {
          categories[item.name] = audioFiles;
        }
      }
    }

    return categories;
  } catch (error) {
    console.error('Error getting audio files:', error);
    return {};
  }
}

/**
 * Check if file is audio
 */
function isAudioFile(filename) {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
  return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Get flat list of all audio files
 */
async function getAllAudioFiles() {
  try {
    const categories = await getAudioFiles();
    const allFiles = [];
    
    for (const [category, files] of Object.entries(categories)) {
      allFiles.push(...files);
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error getting all audio files:', error);
    return [];
  }
}

module.exports = {
  listFilesInFolder,
  getFileUrl,
  getAudioFiles,
  getAllAudioFiles,
  FOLDER_ID
};
