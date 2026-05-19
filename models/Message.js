// Message Model
class Message {
    constructor(firebaseDb) {
        this.db = firebaseDb;
    }

    // Create a new message
    async create(messageData) {
        const { senderId, recipientId, conversationId, messageText, attachmentUrl } = messageData;
        
        return await this.db.createMessage({
            senderId,
            recipientId,
            conversationId,
            messageText,
            attachmentUrl
        });
    }

    // Get conversation or create one
    async getOrCreateConversation(user1Id, user2Id) {
        const minId = Math.min(user1Id, user2Id);
        const maxId = Math.max(user1Id, user2Id);

        let conversation = await this.db.getConversation(minId, maxId);

        if (!conversation) {
            conversation = await this.db.createConversation(minId, maxId);
        }

        return conversation;
    }

    // Get messages in conversation
    async getConversationMessages(conversationId, limit = 50, offset = 0) {
        try {
            const key = await this.db.db.ref('conversations').once('value', (snapshot) => {
                let foundKey = null;
                snapshot.forEach((child) => {
                    if (child.val().id === conversationId) {
                        foundKey = child.key;
                    }
                });
                return foundKey;
            }).then(snap => {
                let foundKey = null;
                snap.forEach((child) => {
                    if (child.val().id === conversationId) {
                        foundKey = child.key;
                    }
                });
                return foundKey;
            });

            if (!key) return [];

            const messages = (await this.db.db.ref(`conversations/${key}/messages`).once('value')).val();
            if (!messages) return [];

            const messageArray = Object.values(messages);
            return messageArray
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(offset, offset + limit);
        } catch (error) {
            console.error('Error getting conversation messages:', error);
            return [];
        }
    }

    // Get all conversations for a user
    async getUserConversations(userId) {
        try {
            const conversations = [];
            const snapshot = await this.db.db.ref('conversations').once('value');
            
            snapshot.forEach((child) => {
                const conv = child.val();
                if (conv.participant1Id === userId || conv.participant2Id === userId) {
                    const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
                    conversations.push({
                        ...conv,
                        otherUserId,
                        key: child.key
                    });
                }
            });

            return conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        } catch (error) {
            console.error('Error getting user conversations:', error);
            return [];
        }
    }

    // Mark message as read
    async markAsRead(messageId) {
        try {
            const snapshot = await this.db.db.ref('messages').once('value');
            snapshot.forEach((child) => {
                if (child.val().id === messageId) {
                    child.ref.update({ isRead: true });
                }
            });
            return true;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    // Mark all messages in conversation as read
    async markConversationAsRead(conversationId, userId) {
        try {
            const key = await this.db.db.ref('conversations').once('value', (snapshot) => {
                let foundKey = null;
                snapshot.forEach((child) => {
                    if (child.val().id === conversationId) {
                        foundKey = child.key;
                    }
                });
                return foundKey;
            }).then(snap => {
                let foundKey = null;
                snap.forEach((child) => {
                    if (child.val().id === conversationId) {
                        foundKey = child.key;
                    }
                });
                return foundKey;
            });

            if (!key) return false;

            const messages = (await this.db.db.ref(`conversations/${key}/messages`).once('value')).val();
            if (!messages) return false;

            for (const msgKey of Object.keys(messages)) {
                const msg = messages[msgKey];
                if (msg.recipientId === userId && !msg.isRead) {
                    await this.db.db.ref(`conversations/${key}/messages/${msgKey}`).update({ isRead: true });
                }
            }

            return true;
        } catch (error) {
            console.error('Error marking conversation as read:', error);
            throw error;
        }
    }

    // Get unread message count for user
    async getUnreadCount(userId) {
        try {
            let count = 0;
            const snapshot = await this.db.db.ref('messages').once('value');
            
            snapshot.forEach((child) => {
                const msg = child.val();
                if (msg.recipientId === userId && !msg.isRead) {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    // Get unread messages
    async getUnreadMessages(userId) {
        try {
            const unreadMessages = [];
            const snapshot = await this.db.db.ref('messages').once('value');
            
            snapshot.forEach((child) => {
                const msg = child.val();
                if (msg.recipientId === userId && !msg.isRead) {
                    unreadMessages.push(msg);
                }
            });

            return unreadMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting unread messages:', error);
            return [];
        }
    }

    // Delete message
    async delete(messageId) {
        try {
            const snapshot = await this.db.db.ref('messages').once('value');
            snapshot.forEach((child) => {
                if (child.val().id === messageId) {
                    child.ref.remove();
                }
            });
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    // Soft-delete: mark message as deleted
    async softDelete(messageId) {
        try {
            const snapshot = await this.db.db.ref('messages').once('value');
            snapshot.forEach((child) => {
                if (child.val().id === messageId) {
                    child.ref.update({ messageText: '__deleted__', deletedBySender: true });
                }
            });
            return true;
        } catch (error) {
            console.error('Error soft-deleting message:', error);
            throw error;
        }
    }

    // Get message by ID
    async getById(messageId) {
        try {
            const snapshot = await this.db.db.ref('messages').once('value');
            let found = null;
            
            snapshot.forEach((child) => {
                if (child.val().id === messageId) {
                    found = child.val();
                }
            });

            return found;
        } catch (error) {
            console.error('Error getting message by ID:', error);
            return null;
        }
    }
}

module.exports = Message;
