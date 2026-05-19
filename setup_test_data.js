const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/GamingZones/Desktop/New folder/Jammazing/db/jammazing.db');

db.serialize(() => {
    // 1. Create test user (ID 1) if not exists
    db.run(\"INSERT OR IGNORE INTO users (id, firstName, lastName, email, username, password, accountType) VALUES (?, ?, ?, ?, ?, ?, ?)\", 
        [1, 'Test', 'User', 'test@example.com', 'testuser', 'password123', 'musician'], (err) => {
        if (err) console.error('Error creating user:', err.message);
        else console.log('User checked/created');
    });

    // 2. Create 2nd test streams with status isLive=0 (archived)
    const streams = [
        { title: 'Amazing Guitar Session', description: 'A long jam session', recordingData: 'base64_data_1' },
        { title: 'Keyboard Practice', description: 'Late night scales', recordingData: 'base64_data_2' },
        { title: 'Drum Solo Performance', description: 'Experimental rhythms', recordingData: 'base64_data_3' }
    ];

    streams.forEach(stream => {
        db.run(\"INSERT INTO liveStreams (streamerId, title, description, isLive, recordingData) VALUES (?, ?, ?, ?, ?)\",
            [1, stream.title, stream.description, 0, stream.recordingData], function(err) {
            if (err) console.error('Error creating stream:', err.message);
            else console.log('Stream created with ID:', this.lastID);
        });
    });

    // Show created streams
    db.all(\"SELECT id, title, description, isLive, recordingData FROM liveStreams WHERE streamerId = 1\", (err, rows) => {
        if (err) console.error('Error fetching streams:', err.message);
        else {
            console.log('--- Created Streams ---');
            console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
