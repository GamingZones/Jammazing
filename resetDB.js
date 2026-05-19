const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to open database:', err);
        process.exit(1);
    }
    
    console.log('🗑️ Clearing all live streams and viewers...');
    
    db.serialize(() => {
        // Clear ALL streams (both live and not live)
        db.run(`DELETE FROM liveStreams`, (err) => {
            if (err) {
                console.error('❌ Failed to clear liveStreams:', err);
            } else {
                console.log('✅ Cleared all liveStreams');
            }
        });
        
        // Clear stream viewers
        db.run(`DELETE FROM streamViewers`, (err) => {
            if (err) {
                console.error('❌ Failed to clear streamViewers:', err);
            } else {
                console.log('✅ Cleared streamViewers');
            }
        });
        
        // Count remaining streams
        db.get(`SELECT COUNT(*) as count FROM liveStreams`, (err, row) => {
            if (err) {
                console.error('❌ Failed to count streams:', err);
            } else {
                console.log(`✅ Total streams remaining: ${row.count}`);
            }
        });
    });
    
    db.close((err) => {
        if (err) {
            console.error('❌ Failed to close database:', err);
            process.exit(1);
        }
        console.log('✅ Database reset complete');
        process.exit(0);
    });
});
