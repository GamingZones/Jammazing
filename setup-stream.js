const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Insert a test stream
    db.run(
        `INSERT INTO liveStreams (streamerId, title, description, isLive, viewerCount, actualStartTime, endTime) 
         VALUES (1, 'Test Stream', 'Test Description', 0, 0, datetime('now'), datetime('now'))`,
        function(err) {
            if (err) {
                console.error('Error inserting stream:', err.message);
            } else {
                console.log('✅ Stream inserted with ID:', this.lastID);
                
                // Now insert test messages for this stream
                const streamId = this.lastID;
                const messages = [
                    { offset: 1.0, text: 'First message at 1 second' },
                    { offset: 5.0, text: 'Second message at 5 seconds' },
                    { offset: 10.0, text: 'Third message at 10 seconds' }
                ];
                
                const stmt = db.prepare(
                    `INSERT INTO streamChat (streamId, senderId, senderName, message, videoOffset, createdAt) 
                     VALUES (?, ?, ?, ?, ?, ?)`
                );
                
                messages.forEach((msg, idx) => {
                    stmt.run(streamId, 2, 'Test Viewer', msg.text, msg.offset, new Date().toISOString(), 
                        (err) => {
                            if (err) console.error(`Error inserting message ${idx + 1}:`, err.message);
                            else console.log(`✅ Message ${idx + 1} inserted at ${msg.offset}s`);
                        }
                    );
                });
                
                stmt.finalize(() => {
                    db.all('SELECT id FROM liveStreams WHERE title = "Test Stream"', (err, rows) => {
                        if (rows && rows[0]) {
                            console.log(`\n📊 Stream ID for testing: ${rows[0].id}`);
                        }
                        db.close();
                    });
                });
            }
        }
    );
});
