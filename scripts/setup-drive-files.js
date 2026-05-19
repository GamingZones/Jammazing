#!/usr/bin/env node
/**
 * Google Drive File ID Extractor
 * 
 * This script helps you populate the drive-files.json config
 * 
 * INSTRUCTIONS:
 * 1. In your browser, go to your Google Drive folder
 * 2. Right-click each file → "Get link" → Copy the link
 * 3. The link format is: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * 4. Extract the FILE_ID part
 * 5. Run this script and paste the links when prompted
 * 
 * Or manually edit config/drive-files.json with the format:
 * {
 *   "Piano": {
 *     "1. a0.wav": "FILE_ID_HERE",
 *     "2. a#0.wav": "FILE_ID_HERE"
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'drive-files.json');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         Google Drive File ID Configuration Helper             ║
╚═══════════════════════════════════════════════════════════════╝

To set up your audio files:

1. Go to: https://drive.google.com/drive/folders/1tQeF2ViGpwWsXqCmZ7QSIVVxFpNYDVaa

2. For each file, right-click → "Get link"

3. Copy the link (looks like):
   https://drive.google.com/file/d/ABC123XYZ/view?usp=sharing

4. Extract the ID part (ABC123XYZ)

5. Edit this file: ${configPath}

6. Replace "REPLACE_WITH_FILE_ID" with the actual IDs

EXAMPLE:
{
  "Piano": {
    "1. a0.wav": "1aB2cD3eF4gH5iJ6k",
    "2. a#0.wav": "2xY3zW4qR5sT6uV7w"
  },
  "Guitar": {
    "A2A3.wav": "3mN4oP5qR6sT7uV8w"
  }
}

Once you've added the file IDs, the audio will load from Google Drive!
`);

// Check if config file exists
if (fs.existsSync(configPath)) {
    console.log(`\n✅ Config file exists at: ${configPath}`);
    console.log(`\nEdit this file to add your Google Drive file IDs.\n`);
} else {
    console.log(`\n⚠️ Config file not found at: ${configPath}`);
    console.log(`Creating it now...\n`);
    
    const defaultConfig = {
        "Piano": {
            "1. a0.wav": "REPLACE_WITH_FILE_ID",
            "2. a#0.wav": "REPLACE_WITH_FILE_ID"
        },
        "Guitar": {
            "A2A3.wav": "REPLACE_WITH_FILE_ID"
        },
        "Drums": {
            "Kick/RD_K_1.wav": "REPLACE_WITH_FILE_ID"
        }
    };
    
    // Create config directory if it doesn't exist
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`✅ Created: ${configPath}\n`);
}

console.log(`Open the file and replace REPLACE_WITH_FILE_ID with actual Drive file IDs.\n`);
