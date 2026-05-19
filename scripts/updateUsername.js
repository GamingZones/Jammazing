const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/jammazing.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
    updateUsername();
});

function updateUsername() {
    const email = 'Zaki@gmail.com';
    const username = 'GamingZones';

    db.run(
        'UPDATE users SET username = ? WHERE email = ?',
        [username, email],
        function(err) {
            if (err) {
                console.error('Error updating username:', err);
                db.close();
                process.exit(1);
            }
            console.log(`✅ Successfully updated username to "${username}" for ${email}`);
            
            // Verify the update
            db.get('SELECT id, email, username FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    console.error('Error verifying update:', err);
                } else if (row) {
                    console.log('Updated record:', row);
                }
                db.close(() => {
                    console.log('Database connection closed');
                    process.exit(0);
                });
            });
        }
    );
}
