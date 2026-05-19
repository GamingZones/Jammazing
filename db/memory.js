// In-Memory Database (stores data in RAM)
// Data resets when server restarts

class MemoryDatabase {
    constructor() {
        this.users = new Map();
        this.quizzes = new Map();
        this.liveStreams = new Map();
        this.messages = new Map();
        this.backingTracks = new Map();
        this.notifications = new Map();
        this.emailIndex = new Map(); // email -> userId
        this.usernameIndex = new Map(); // username -> userId
        this.nextId = 1;
        this.initialized = true;
    }

    async initialize() {
        console.log('✅ In-Memory Database initialized');
        return true;
    }

    generateId() {
        return `id_${this.nextId++}`;
    }

    // USERS Operations
    async createUser(userData) {
        const userId = this.generateId();
        const user = {
            _id: userId,
            id: userId,
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Check for duplicates
        if (this.emailIndex.has(userData.email)) {
            throw new Error('email already exists');
        }
        if (this.usernameIndex.has(userData.username)) {
            throw new Error('username already exists');
        }

        this.users.set(userId, user);
        this.emailIndex.set(userData.email, userId);
        this.usernameIndex.set(userData.username, userId);

        console.log(`✅ User created: ${userId}`);
        return user;
    }

    async getUserByEmail(email) {
        const userId = this.emailIndex.get(email);
        if (!userId) return null;
        return this.users.get(userId);
    }

    async getUserByUsername(username) {
        const userId = this.usernameIndex.get(username);
        if (!userId) return null;
        return this.users.get(userId);
    }

    async getUserById(id) {
        return this.users.get(id) || null;
    }

    async getAllUsers() {
        return Array.from(this.users.values());
    }

    async updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        Object.assign(user, updates, { updatedAt: new Date() });
        this.users.set(userId, user);
        return true;
    }

    async deleteUser(userId) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        this.emailIndex.delete(user.email);
        this.usernameIndex.delete(user.username);
        this.users.delete(userId);
        return true;
    }

    // QUIZ Operations
    async createQuiz(quizData) {
        const quizId = this.generateId();
        const quiz = {
            _id: quizId,
            ...quizData,
            createdAt: new Date()
        };
        this.quizzes.set(quizId, quiz);
        return quizId;
    }

    async addQuestionToQuiz(quizId, question) {
        const quiz = this.quizzes.get(quizId);
        if (!quiz) return false;
        
        if (!quiz.questions) quiz.questions = [];
        quiz.questions.push(question);
        return true;
    }

    async recordAttempt(quizId, userId, attempt) {
        const msgId = this.generateId();
        this.messages.set(msgId, {
            _id: msgId,
            quizId,
            userId,
            ...attempt,
            createdAt: new Date()
        });
        return true;
    }

    // LIVE STREAMS Operations
    async createLiveStream(streamData) {
        const streamId = this.generateId();
        const stream = {
            _id: streamId,
            ...streamData,
            createdAt: new Date()
        };
        this.liveStreams.set(streamId, stream);
        return streamId;
    }

    async addStreamViewer(streamId, userId) {
        const stream = this.liveStreams.get(streamId);
        if (!stream) return false;
        
        if (!stream.viewers) stream.viewers = [];
        if (!stream.viewers.includes(userId)) {
            stream.viewers.push(userId);
        }
        return true;
    }

    // MESSAGES Operations
    async createMessage(messageData) {
        const msgId = this.generateId();
        const msg = {
            _id: msgId,
            ...messageData,
            createdAt: new Date()
        };
        this.messages.set(msgId, msg);
        return msgId;
    }

    async getConversation(userId1, userId2) {
        const msgs = Array.from(this.messages.values()).filter(m =>
            (m.from === userId1 && m.to === userId2) ||
            (m.from === userId2 && m.to === userId1)
        );
        return msgs.sort((a, b) => b.createdAt - a.createdAt);
    }

    async markAsRead(messageId) {
        const msg = this.messages.get(messageId);
        if (!msg) return false;
        msg.read = true;
        return true;
    }

    // BACKING TRACKS Operations
    async createBackingTrack(trackData) {
        const trackId = this.generateId();
        const track = {
            _id: trackId,
            ...trackData,
            playCount: 0,
            createdAt: new Date()
        };
        this.backingTracks.set(trackId, track);
        return trackId;
    }

    async searchBackingTracks(query) {
        return Array.from(this.backingTracks.values()).filter(t =>
            t.title?.includes(query) || t.artist?.includes(query)
        );
    }

    async incrementPlayCount(trackId) {
        const track = this.backingTracks.get(trackId);
        if (!track) return false;
        track.playCount = (track.playCount || 0) + 1;
        return true;
    }

    // NOTIFICATIONS Operations
    async createNotification(notifData) {
        const notifId = this.generateId();
        const notif = {
            _id: notifId,
            ...notifData,
            read: false,
            createdAt: new Date()
        };
        this.notifications.set(notifId, notif);
        return notifId;
    }

    async getUserNotifications(userId) {
        return Array.from(this.notifications.values())
            .filter(n => n.userId === userId)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    async getUnreadCount(userId) {
        return Array.from(this.notifications.values())
            .filter(n => n.userId === userId && !n.read).length;
    }
}

module.exports = MemoryDatabase;
