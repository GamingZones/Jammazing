// User Model
class User {
    constructor(db) {
        this.db = db;
    }

    // Create a new user
    async create(userData) {
        const { firstName, lastName, email, username, password, accountType, instrument } = userData;
        
        const sql = `
            INSERT INTO users (firstName, lastName, email, username, password, accountType, instrument)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await this.db.run(sql, [
            firstName,
            lastName,
            email,
            username,
            password,
            accountType,
            instrument || ''
        ]);

        return result;
    }

    // Get user by ID
    async getById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        return await this.db.get(sql, [id]);
    }

    // Get user by email
    async getByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return await this.db.get(sql, [email]);
    }

    // Get user by username
    async getByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return await this.db.get(sql, [username]);
    }

    // Get all users
    async getAll() {
        const sql = 'SELECT * FROM users ORDER BY createdAt DESC';
        return await this.db.all(sql);
    }

    // Get all instructors
    async getInstructors() {
        const sql = 'SELECT * FROM users WHERE accountType = ? ORDER BY firstName ASC';
        return await this.db.all(sql, ['instructor']);
    }

    // Get all students
    async getStudents() {
        const sql = 'SELECT * FROM users WHERE accountType = ? ORDER BY firstName ASC';
        return await this.db.all(sql, ['student']);
    }

    // Update user
    async update(id, userData) {
        const { firstName, lastName, bio, instrument, profilePicture } = userData;
        
        const sql = `
            UPDATE users 
            SET firstName = COALESCE(?, firstName),
                lastName = COALESCE(?, lastName),
                bio = COALESCE(?, bio),
                instrument = COALESCE(?, instrument),
                profilePicture = COALESCE(?, profilePicture),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        return await this.db.run(sql, [
            firstName,
            lastName,
            bio,
            instrument,
            profilePicture,
            id
        ]);
    }

    // Delete user
    async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Change password
    async changePassword(id, newPassword) {
        const sql = 'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.db.run(sql, [newPassword, id]);
    }

    // Get user profile with detailed info
    async getUserProfile(id) {
        const sql = `
            SELECT u.*, up.* 
            FROM users u
            LEFT JOIN userProfiles up ON u.id = up.userId
            WHERE u.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    // Count total users
    async countUsers() {
        const sql = 'SELECT COUNT(*) as count FROM users';
        const result = await this.db.get(sql);
        return result.count;
    }

    // Get users by account type
    async getUsersByAccountType(accountType) {
        const sql = 'SELECT * FROM users WHERE accountType = ? ORDER BY createdAt DESC';
        return await this.db.all(sql, [accountType]);
    }
}

module.exports = User;
