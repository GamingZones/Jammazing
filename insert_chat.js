const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("jammazing.db");
db.serialize(() => {
    db.run("INSERT INTO streamChat (streamId, senderId, senderName, message, videoOffset, createdAt) VALUES (33, 2, 'Test Viewer', 'First message', 1, datetime('now')), (33, 2, 'Test Viewer', 'Second message', 5, datetime('now')), (33, 2, 'Test Viewer', 'Third message', 10, datetime('now'))", function(err) {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
        db.all("SELECT * FROM streamChat WHERE streamId = 33", (err, rows) => {
            if (err) {
                console.error(err.message);
                process.exit(1);
            }
            console.log(JSON.stringify(rows, null, 2));
            db.close();
        });
    });
});
