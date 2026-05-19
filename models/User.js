// User Model
class User {
    constructor(firebaseDb) {
        this.db = firebaseDb;
    }

    // Create a new user
    async create(userData) {
        console.log('👤 User.create called with:', { firstName: userData.firstName, email: userData.email, username: userData.username });
        const { firstName, lastName, email, username, password, accountType, instrument } = userData;
        
        console.log('👤 About to call this.db.createUser...');
        console.log('👤 this.db is:', this.db ? '✅ exists' : '❌ NULL');
        console.log('👤 this.db.createUser is:', this.db && this.db.createUser ? '✅ exists' : '❌ NULL');
        
        try {
            const result = await this.db.createUser({
                firstName,
                lastName,
                email,
                username,
                password,
                accountType,
                instrument: instrument || ''
            });
            console.log('👤 this.db.createUser returned:', result ? '✅ SUCCESS' : '❌ null');
            return result;
        } catch (err) {
            console.error('👤 this.db.createUser threw error:', err.message);
            throw err;
        }
    }

    // Get user by ID
    async getById(id) {
        return await this.db.getUserById(id);
    }

    // Get user by email
    async getByEmail(email) {
        return await this.db.getUserByEmail(email);
    }

    // Get user by username
    async getByUsername(username) {
        return await this.db.getUserByUsername(username);
    }

    // Get all users
    async getAll() {
        return await this.db.getAllUsers();
    }

    // Get all instructors
    async getInstructors() {
        const users = await this.db.getAllUsers();
        return users.filter(u => u.accountType === 'instructor').sort((a, b) => a.firstName.localeCompare(b.firstName));
    }

    // Get all students
    async getStudents() {
        const users = await this.db.getAllUsers();
        return users.filter(u => u.accountType === 'student').sort((a, b) => a.firstName.localeCompare(b.firstName));
    }

    // Update user
    async update(id, userData) {
        const { firstName, lastName, bio, instrument, profilePicture } = userData;
        
        const updates = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (bio !== undefined) updates.bio = bio;
        if (instrument !== undefined) updates.instrument = instrument;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;

        return await this.db.updateUser(id, updates);
    }

    // Delete user
    async delete(id) {
        try {
            await this.db.db.ref(`users/${id}`).remove();
            await this.db.db.ref(`users_by_email`).once('value', (snapshot) => {
                snapshot.forEach((child) => {
                    if (child.val() === id) child.ref.remove();
                });
            });
            await this.db.db.ref(`users_by_username`).once('value', (snapshot) => {
                snapshot.forEach((child) => {
                    if (child.val() === id) child.ref.remove();
                });
            });
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Change password
    async changePassword(id, newPassword) {
        return await this.db.updateUser(id, { password: newPassword });
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
