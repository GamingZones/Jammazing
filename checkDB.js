const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to open database:', err);
        process.exit(1);
    }
    
    console.log('📊 Querying recent streams with actualStartTime...\n');
    
    db.all(`
        SELECT id, title, isLive, actualStartTime, createdAt 
        FROM liveStreams 
        ORDER BY id DESC 
        LIMIT 5
    `, (err, rows) => {
        if (err) {
            console.error('❌ Query failed:', err);
        } else {
            console.log('Top 5 most recent streams:');
            console.table(rows);
            console.log('\n');
            rows.forEach(stream => {
                if (stream.actualStartTime) {
                    const startTime = new Date(stream.actualStartTime);
                    const now = new Date();
                    const durationSecs = Math.floor((now - startTime) / 1000);
                    const hours = Math.floor(durationSecs / 3600);
                    const mins = Math.floor((durationSecs % 3600) / 60);
                    const secs = durationSecs % 60;
                    console.log(`Stream ${stream.id} (${stream.title}): Duration would be ${hours}:${mins}:${secs}`);
                }
            });
        }
        
        db.close();
        process.exit(0);
    });
});
