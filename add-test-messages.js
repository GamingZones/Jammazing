const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

// Add test messages to stream 33
const streamId = 33;
const now = new Date();

const messages = [
  {
    streamId,
    senderId: 2,
    senderName: 'Test Viewer',
    message: 'First message at 1 second',
    videoOffset: 1.0,
    createdAt: new Date(now.getTime() + 1000).toISOString()
  },
  {
    streamId,
    senderId: 2,
    senderName: 'Test Viewer',
    message: 'Second message at 5 seconds',
    videoOffset: 5.0,
    createdAt: new Date(now.getTime() + 5000).toISOString()
  },
  {
    streamId,
    senderId: 2,
    senderName: 'Test Viewer',
    message: 'Third message at 10 seconds',
    videoOffset: 10.0,
    createdAt: new Date(now.getTime() + 10000).toISOString()
  }
];

db.serialize(() => {
  // First check if table exists
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='streamChat'", (err, rows) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      return;
    }
    
    if (!rows || rows.length === 0) {
      console.log('streamChat table does not exist. Creating...');
      
      // Create table
      db.run(`
        CREATE TABLE streamChat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          streamId INTEGER NOT NULL,
          senderId INTEGER NOT NULL,
          senderName TEXT NOT NULL,
          message TEXT NOT NULL,
          videoOffset REAL DEFAULT 0.0,
          createdAt TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          db.close();
          return;
        }
        console.log('✅ streamChat table created');
        insertMessages();
      });
    } else {
      console.log('✅ streamChat table exists');
      insertMessages();
    }
  });
});

function insertMessages() {
  messages.forEach((msg, idx) => {
    db.run(
      `INSERT INTO streamChat (streamId, senderId, senderName, message, videoOffset, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [msg.streamId, msg.senderId, msg.senderName, msg.message, msg.videoOffset, msg.createdAt],
      function(err) {
        if (err) {
          console.error(`Error inserting message ${idx + 1}:`, err);
        } else {
          console.log(`✅ Message ${idx + 1} inserted (videoOffset: ${msg.videoOffset}s)`);
        }
        
        if (idx === messages.length - 1) {
          // Verify by reading back
          setTimeout(() => {
            db.all(
              'SELECT id, message, videoOffset FROM streamChat WHERE streamId = ? ORDER BY videoOffset ASC',
              [streamId],
              (err, rows) => {
                if (err) {
                  console.error('Error reading messages:', err);
                } else {
                  console.log('\n📋 Messages in database for stream 33:');
                  rows.forEach(row => {
                    console.log(`  - ID ${row.id}: "${row.message}" @ ${row.videoOffset}s`);
                  });
                }
                db.close();
                process.exit(0);
              }
            );
          }, 100);
        }
      }
    );
  });
}
