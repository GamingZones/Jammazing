const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

db.all(
    `SELECT id, senderId, senderName, message, videoOffset, createdAt FROM streamChat WHERE streamId = 1 ORDER BY id DESC LIMIT 5`,
    (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('📋 Latest chat messages in database:');
            rows.forEach(row => {
                console.log(`  - ID ${row.id}: "${row.message}" by ${row.senderName} @ ${row.videoOffset}s`);
                console.log(`    createdAt: ${row.createdAt}`);
            });
        }
        db.close();
    }
);
