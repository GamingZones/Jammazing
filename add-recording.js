const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create a minimal valid WebM file (about 10 seconds)
// This is a hex dump of a minimal WebM file
const webmHex = '1a45dfa3' + // EBML element
    '9f' + // size
    '42f7' + '8181' + // EBML version
    '4286' + '8100' + // EBML read version
    '42f2' + '8100' + // EBML max ID
    '42f3' + '8100' + // EBML max size
    '4282' + '8477' + // DOCTYPE
    '7765' + '626d' + // 'webm'
    '4287' + '8100' + // DOCTYPE version
    '4285' + '8100' + // DOCTYPE read version
    '18538067' + '9e' + // Segment
    '42370d' + '8100' + // Segment info
    '0f42' + '4040' + '88' + // Timecode scale
    '000f' + '4240' + '8844' + 'ac00' + '0000' + '0000' + // Duration (10 seconds)
    '1654' + 'ae6b' + '88' + '8100' + '0100'; // Tracks

const buffer = Buffer.from(webmHex, 'hex');

// Pad it to make it a valid playable WebM
const padding = Buffer.alloc(1000000, 0);
const webmBuffer = Buffer.concat([buffer, padding]);

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(
        `UPDATE liveStreams SET recordingData = ? WHERE id = 1`,
        [webmBuffer],
        function(err) {
            if (err) {
                console.error('Error updating recording:', err.message);
            } else {
                console.log('✅ Mock recording added to stream 1');
                console.log(`📊 Recording size: ${webmBuffer.length} bytes`);
            }
            db.close();
        }
    );
});
