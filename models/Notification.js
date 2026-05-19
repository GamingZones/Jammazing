// Notification Model
class Notification {
    constructor(db) {
        this.db = db;
    }

    // Create a new notification
    async create(notificationData) {
        const { userId, title, message, notificationType, relatedId } = notificationData;
        
        const sql = `
            INSERT INTO notifications (userId, title, message, notificationType, relatedId)
            VALUES (?, ?, ?, ?, ?)
        `;

        return await this.db.run(sql, [
            userId,
            title,
            message,
            notificationType,
            relatedId
        ]);
    }

    // Get notifications for user
    async getForUser(userId, limit = 20, offset = 0) {
        const sql = `
            SELECT * FROM notifications
            WHERE userId = ?
            ORDER BY createdAt DESC
            LIMIT ? OFFSET ?
        `;
        return await this.db.all(sql, [userId, limit, offset]);
    }

    // Get unread notifications
    async getUnread(userId) {
        const sql = `
            SELECT * FROM notifications
            WHERE userId = ? AND isRead = 0
            ORDER BY createdAt DESC
        `;
        return await this.db.all(sql, [userId]);
    }

    // Get unread count
    async getUnreadCount(userId) {
        const sql = 'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0';
        const result = await this.db.get(sql, [userId]);
        return result.count;
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        const sql = 'UPDATE notifications SET isRead = 1 WHERE id = ?';
        return await this.db.run(sql, [notificationId]);
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        const sql = 'UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0';
        return await this.db.run(sql, [userId]);
    }

    // Delete notification
    async delete(notificationId) {
        const sql = 'DELETE FROM notifications WHERE id = ?';
        return await this.db.run(sql, [notificationId]);
    }

    // Delete all notifications for user
    async deleteAllForUser(userId) {
        const sql = 'DELETE FROM notifications WHERE userId = ?';
        return await this.db.run(sql, [userId]);
    }

    // Get notification by ID
    async getById(id) {
        const sql = 'SELECT * FROM notifications WHERE id = ?';
        return await this.db.get(sql, [id]);
    }

    // Send multiple notifications
    async createBulk(notifications) {
        await this.db.beginTransaction();
        
        try {
            const results = [];
            for (const notification of notifications) {
                const result = await this.create(notification);
                results.push(result);
            }
            await this.db.commitTransaction();
            return results;
        } catch (err) {
            await this.db.rollbackTransaction();
            throw err;
        }
    }
}

module.exports = Notification;
