const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'jammazing.db');

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    // Initialize database with schema
    async initializeDatabase() {
        try {
            await this.connect();
            await this.runSchema();
            await this.runMigrations();
            console.log('Database initialized successfully');
        } catch (err) {
            console.error('Failed to initialize database:', err);
            throw err;
        }
    }

    // Run migrations to add missing columns to existing tables
    async runMigrations() {
        const migrations = [
            `ALTER TABLE users ADD COLUMN bio TEXT`,
            `ALTER TABLE users ADD COLUMN profilePicture TEXT`,
            `ALTER TABLE liveStreams ADD COLUMN recordingData LONGBLOB`
        ];
        for (const sql of migrations) {
            try {
                await this.run(sql);
            } catch (err) {
                // Ignore "duplicate column" errors - column already exists
                if (!err.message.includes('duplicate column name')) {
                    console.error('Migration error:', err.message);
                }
            }
        }
    }

    // Run the schema file
    runSchema() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error running schema:', err);
                    reject(err);
                } else {
                    console.log('Schema executed successfully');
                    resolve();
                }
            });
        });
    }

    // Run a query that doesn't return data
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Get a single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Close the database connection
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Transaction support
    async beginTransaction() {
        await this.run('BEGIN TRANSACTION');
    }

    async commitTransaction() {
        await this.run('COMMIT');
    }

    async rollbackTransaction() {
        await this.run('ROLLBACK');
    }

    // Clear all data (for testing)
    async clearDatabase() {
        const tables = [
            'ratings',
            'learningProgress',
            'followers',
            'notifications',
            'backingTracks',
            'streamViewers',
            'liveStreams',
            'quizAttempts',
            'quizQuestionOptions',
            'quizQuestions',
            'quizzes',
            'messages',
            'conversations',
            'userProfiles',
            'users'
        ];

        for (const table of tables) {
            await this.run(`DELETE FROM ${table}`);
        }
        console.log('Database cleared');
    }
}

module.exports = Database;
