const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create a minimal but valid WebM file header
// This creates a small WebM file that browsers can play (though it will be short/empty)
const createMockWebM = () => {
    // EBML header + Segment structure with proper WebM format
    const ebmlHeader = Buffer.from([
        0x1a, 0x45, 0xdf, 0xa3, // EBML element
        0x9f, // size (127 bytes)
        0x42, 0xf7, 0x81, 0x01, // EBML version (1)
        0x42, 0xf2, 0x81, 0x04, // EBML read version (4)
        0x42, 0xf3, 0x81, 0x08, // EBML max ID size (8)
        0x42, 0xf3, 0x81, 0x01, // EBML max size size (1) 
        0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, // DOCTYPE ("webm")
        0x42, 0x87, 0x81, 0x02, // DOCTYPE version (2)
        0x42, 0x85, 0x81, 0x02, // DOCTYPE read version (2)
    ]);

    const segmentHeader = Buffer.from([
        0x18, 0x53, 0x80, 0x67, // Segment element
        0xff, // size (unknown/infinite)
    ]);

    const info = Buffer.from([
        0x15, 0x49, 0xa9, 0x66, // Info element
        0xed, // size
        0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40, // TimecodeScale (1000000 ns = 1ms)
        0x44, 0x89, 0x84, 0x44, 0xac, 0x00, 0x00, // Duration (some duration)
        0x4d, 0x80, 0x84, 0x4a, 0x6d, 0x6d, 0x7a, // MuxingApp
        0x57, 0x41, 0x87, 0x4d, 0x75, 0x78, 0x31, 0x37, 0x32, // WritingApp
    ]);

    return Buffer.concat([ebmlHeader, segmentHeader, info]);
};

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

const webmBuffer = createMockWebM();

db.serialize(() => {
    db.run(
        `UPDATE liveStreams SET recordingData = ? WHERE id = 1`,
        [webmBuffer],
        function(err) {
            if (err) {
                console.error('Error updating recording:', err.message);
            } else {
                console.log('✅ Mock WebM video added to stream 1');
                console.log(`📊 Recording size: ${webmBuffer.length} bytes`);
            }
            db.close();
        }
    );
});
