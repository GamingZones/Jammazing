// Notification Model for MongoDB
class Notification {
    constructor(mongoDb) {
        this.db = mongoDb;
    }

    // Create a new notification
    async create(notificationData) {
        const { userId, title, message, notificationType, relatedId } = notificationData;
        
        return await this.db.createNotification({
            userId,
            title,
            message,
            notificationType,
            relatedId
        });
    }

    // Get notifications for user
    async getForUser(userId, limit = 20, offset = 0) {
        try {
            const notifications = await this.db.getUserNotifications(userId);
            return notifications.slice(offset, offset + limit);
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return [];
        }
    }

    // Get unread notifications
    async getUnread(userId) {
        try {
            const notifications = await this.db.getUserNotifications(userId);
            return notifications.filter(n => !n.isRead);
        } catch (error) {
            console.error('Error getting unread notifications:', error);
            return [];
        }
    }

    // Get unread count
    async getUnreadCount(userId) {
        try {
            const unread = await this.getUnread(userId);
            return unread.length;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const snapshot = await this.db.db.ref('notifications').once('value');
            snapshot.forEach((child) => {
                if (child.val().id === notificationId) {
                    child.ref.update({ isRead: true });
                }
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        try {
            const notifications = await this.db.getUserNotifications(userId);
            for (const notif of notifications) {
                if (!notif.isRead) {
                    await this.markAsRead(notif.id);
                }
            }
            return true;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    // Delete notification
    async delete(notificationId) {
        try {
            const snapshot = await this.db.db.ref('notifications').once('value');
            snapshot.forEach((child) => {
                if (child.val().id === notificationId) {
                    child.ref.remove();
                }
            });
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // Delete all notifications for user
    async deleteAllForUser(userId) {
        try {
            const notifications = await this.db.getUserNotifications(userId);
            for (const notif of notifications) {
                await this.delete(notif.id);
            }
            return true;
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw error;
        }
    }

    // Get notification by ID
    async getById(id) {
        try {
            const snapshot = await this.db.db.ref('notifications').once('value');
            let found = null;
            
            snapshot.forEach((child) => {
                if (child.val().id === id) {
                    found = child.val();
                }
            });

            return found;
        } catch (error) {
            console.error('Error getting notification by ID:', error);
            return null;
        }
    }

    // Send multiple notifications
    async createBulk(notifications) {
        try {
            const results = [];
            for (const notification of notifications) {
                const result = await this.create(notification);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }
}

module.exports = Notification;
