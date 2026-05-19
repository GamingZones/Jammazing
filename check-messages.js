const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'jammazing.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Check if table exists
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='streamChat'", (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }
    
    if (!rows || rows.length === 0) {
      console.log('❌ streamChat table does NOT exist');
      db.close();
      return;
    }
    
    console.log('✅ streamChat table exists');
    
    // Get all messages for stream 33
    db.all(
      'SELECT * FROM streamChat WHERE streamId = 33 ORDER BY videoOffset ASC',
      (err, rows) => {
        if (err) {
          console.error('❌ Query error:', err);
        } else {
          console.log(`\n📋 Found ${rows.length} messages in stream 33:`);
          if (rows.length === 0) {
            console.log('   (No messages)');
          } else {
            rows.forEach(row => {
              console.log(`   ID ${row.id}: "${row.message}" at ${row.videoOffset}s`);
            });
          }
        }
        
        // Also check total message count
        db.get('SELECT COUNT(*) as count FROM streamChat', (err, row) => {
          if (!err) {
            console.log(`\n📊 Total messages in database: ${row.count}`);
          }
          db.close();
          process.exit(0);
        });
      }
    );
  });
});
