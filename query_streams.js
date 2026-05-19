const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/GamingZones/Desktop/New folder/Jammazing/db/jammazing.db');

db.all('SELECT id, title, actualStartTime, endTime FROM liveStreams LIMIT 5', [], (err, rows) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
