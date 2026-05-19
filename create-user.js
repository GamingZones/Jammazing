const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'jammazing.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Create test user
    db.run(
        `INSERT INTO users (firstName, lastName, email, username, password, accountType) 
         VALUES ('Gaming', 'Zones', 'gaming@zones.com', 'gamingzones', 'hashed_password', 'instructor')`,
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log('✅ Test user already exists');
                } else {
                    console.error('Error inserting user:', err.message);
                }
            } else {
                console.log('✅ Test user created with ID:', this.lastID);
            }
            
            // Verify user exists
            db.get('SELECT id, username, firstName FROM users WHERE id = 1', (err, row) => {
                if (err) {
                    console.error('Error checking user:', err.message);
                } else if (row) {
                    console.log(`✅ Verified: User ${row.id} - ${row.firstName} (@${row.username})`);
                } else {
                    console.log('⚠️ User 1 not found');
                }
                db.close();
            });
        }
    );
});
