// Fix archived stream times
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/jammazing.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

// Fix archived streams that don't have proper actualStartTime
db.all(`
    SELECT id, actualStartTime, endTime, createdAt 
    FROM liveStreams 
    WHERE isLive = 0 AND endTime IS NOT NULL
`, async (err, rows) => {
    if (err) {
        console.error('Error fetching streams:', err);
        db.close();
        process.exit(1);
    }
    
    console.log(`Found ${rows.length} archived streams to check...`);
    
    for (const stream of rows) {
        console.log(`\nStream ${stream.id}:`);
        console.log(`  actualStartTime: ${stream.actualStartTime}`);
        console.log(`  endTime: ${stream.endTime}`);
        console.log(`  createdAt: ${stream.createdAt}`);
        
        // If actualStartTime is NULL or invalid, use createdAt minus some time
        if (!stream.actualStartTime || stream.actualStartTime === 'NULL') {
            const createdDate = new Date(stream.createdAt);
            // Set actualStartTime to 1 minute before endTime for testing
            const endDate = new Date(stream.endTime);
            const calculatedStartTime = new Date(endDate.getTime() - 60000).toISOString(); // 1 minute before end
            
            console.log(`  Updating actualStartTime to: ${calculatedStartTime}`);
            
            db.run(
                'UPDATE liveStreams SET actualStartTime = ? WHERE id = ?',
                [calculatedStartTime, stream.id],
                (err) => {
                    if (err) {
                        console.error(`  Error updating stream ${stream.id}:`, err);
                    } else {
                        console.log(`  ✅ Updated stream ${stream.id}`);
                    }
                }
            );
        }
    }
    
    setTimeout(() => {
        console.log('\n✅ Done fixing archived stream times');
        db.close();
    }, 1000);
});
