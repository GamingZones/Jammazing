// Message Model
class Message {
    constructor(db) {
        this.db = db;
    }

    // Create a new message
    async create(messageData) {
        const { senderId, recipientId, conversationId, messageText, attachmentUrl } = messageData;
        
        const sql = `
            INSERT INTO messages (senderId, recipientId, conversationId, messageText, attachmentUrl)
            VALUES (?, ?, ?, ?, ?)
        `;

        return await this.db.run(sql, [
            senderId,
            recipientId,
            conversationId,
            messageText,
            attachmentUrl
        ]);
    }

    // Get conversation or create one
    async getOrCreateConversation(user1Id, user2Id) {
        const minId = Math.min(user1Id, user2Id);
        const maxId = Math.max(user1Id, user2Id);

        let conversation = await this.db.get(
            'SELECT * FROM conversations WHERE participant1Id = ? AND participant2Id = ?',
            [minId, maxId]
        );

        if (!conversation) {
            const result = await this.db.run(
                'INSERT INTO conversations (participant1Id, participant2Id) VALUES (?, ?)',
                [minId, maxId]
            );
            conversation = { id: result.id, participant1Id: minId, participant2Id: maxId };
        }

        return conversation;
    }

    // Get messages in conversation
    async getConversationMessages(conversationId, limit = 50, offset = 0) {
        const sql = `
            SELECT m.*, u.username, u.firstName, u.lastName
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.conversationId = ?
            ORDER BY m.createdAt DESC
            LIMIT ? OFFSET ?
        `;
        return await this.db.all(sql, [conversationId, limit, offset]);
    }

    // Get all conversations for a user
    async getUserConversations(userId) {
        const sql = `
            SELECT 
                c.*,
                m.messageText as lastMessage,
                m.createdAt as lastMessageTime,
                CASE 
                    WHEN c.participant1Id = ? THEN u2.username
                    ELSE u1.username
                END as otherUsername,
                CASE 
                    WHEN c.participant1Id = ? THEN u2.id
                    ELSE u1.id
                END as otherUserId
            FROM conversations c
            JOIN users u1 ON c.participant1Id = u1.id
            JOIN users u2 ON c.participant2Id = u2.id
            LEFT JOIN messages m ON c.id = m.conversationId
            WHERE c.participant1Id = ? OR c.participant2Id = ?
            ORDER BY m.createdAt DESC
        `;
        return await this.db.all(sql, [userId, userId, userId, userId]);
    }

    // Mark message as read
    async markAsRead(messageId) {
        const sql = 'UPDATE messages SET isRead = 1 WHERE id = ?';
        return await this.db.run(sql, [messageId]);
    }

    // Mark all messages in conversation as read
    async markConversationAsRead(conversationId, userId) {
        const sql = `
            UPDATE messages 
            SET isRead = 1 
            WHERE conversationId = ? AND recipientId = ?
        `;
        return await this.db.run(sql, [conversationId, userId]);
    }

    // Get unread message count for user
    async getUnreadCount(userId) {
        const sql = 'SELECT COUNT(*) as count FROM messages WHERE recipientId = ? AND isRead = 0';
        const result = await this.db.get(sql, [userId]);
        return result.count;
    }

    // Get unread messages
    async getUnreadMessages(userId) {
        const sql = `
            SELECT m.*, u.username, u.firstName, u.lastName
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.recipientId = ? AND m.isRead = 0
            ORDER BY m.createdAt DESC
        `;
        return await this.db.all(sql, [userId]);
    }

    // Delete message
    async delete(messageId) {
        const sql = 'DELETE FROM messages WHERE id = ?';
        return await this.db.run(sql, [messageId]);
    }

    // Soft-delete: mark message as deleted (keeps row, replaces text)
    async softDelete(messageId) {
        const sql = `UPDATE messages SET messageText = '__deleted__', deletedBySender = 1 WHERE id = ?`;
        return await this.db.run(sql, [messageId]);
    }

    // Get message by ID
    async getById(messageId) {
        const sql = `
            SELECT m.*, u.username, u.firstName, u.lastName
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.id = ?
        `;
        return await this.db.get(sql, [messageId]);
    }
}

module.exports = Message;
