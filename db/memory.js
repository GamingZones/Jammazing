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
        this.posts = new Map();
        this.post_likes = new Map();
        this.post_reposts = new Map();
        this.post_replies = new Map();
        this.post_comments = new Map();
        this.emailIndex = new Map(); // email -> userId
        this.usernameIndex = new Map(); // username -> userId
        this.nextId = 1;
        this.postId = 1;
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

    // POSTS Operations - SQL-like interface for compatibility
    async run(sql, params = []) {
        if (sql.includes('INSERT INTO posts')) {
            const [userId, content, imageData, videoData] = params;
            const postId = `post_${this.postId++}`;
            const post = {
                id: postId,
                userId,
                content,
                imageData,
                videoData,
                createdAt: new Date().toISOString(),
                likeCount: 0,
                repostCount: 0,
                replyCount: 0,
                commentCount: 0
            };
            this.posts.set(postId, post);
            return { id: postId };
        } else if (sql.includes('DELETE FROM posts')) {
            const [postId] = params;
            this.posts.delete(postId);
            return { changes: 1 };
        } else if (sql.includes('INSERT INTO post_likes')) {
            const [postId, userId] = params;
            const likeId = `like_${postId}_${userId}`;
            this.post_likes.set(likeId, { postId, userId, createdAt: new Date().toISOString() });
            return { id: likeId };
        } else if (sql.includes('DELETE FROM post_likes')) {
            const [postId, userId] = params;
            const likeId = `like_${postId}_${userId}`;
            this.post_likes.delete(likeId);
            return { changes: 1 };
        } else if (sql.includes('INSERT INTO post_reposts')) {
            const [postId, userId] = params;
            const repostId = `repost_${postId}_${userId}`;
            this.post_reposts.set(repostId, { postId, userId, createdAt: new Date().toISOString() });
            return { id: repostId };
        } else if (sql.includes('DELETE FROM post_reposts')) {
            const [postId, userId] = params;
            const repostId = `repost_${postId}_${userId}`;
            this.post_reposts.delete(repostId);
            return { changes: 1 };
        } else if (sql.includes('INSERT INTO post_comments')) {
            const [postId, userId, content] = params;
            const commentId = `comment_${postId}_${userId}_${Date.now()}`;
            this.post_comments.set(commentId, { id: commentId, postId, userId, content, createdAt: new Date().toISOString() });
            return { id: commentId };
        }
        return { id: null };
    }

    async get(sql, params = []) {
        if (sql.includes('SELECT posts') && sql.includes('WHERE posts.id = ?')) {
            const [postId] = params;
            const post = this.posts.get(postId);
            if (!post) return null;
            const user = this.users.get(post.userId);
            return {
                id: post.id,
                content: post.content,
                imageData: post.imageData,
                videoData: post.videoData,
                createdAt: post.createdAt,
                userId: user?.id,
                firstName: user?.firstName,
                lastName: user?.lastName,
                username: user?.username,
                profilePicture: user?.profilePicture,
                likeCount: post.likeCount,
                repostCount: post.repostCount,
                replyCount: post.replyCount,
                commentCount: post.commentCount
            };
        } else if (sql.includes('SELECT * FROM posts WHERE id = ?')) {
            const [postId] = params;
            return this.posts.get(postId);
        } else if (sql.includes('SELECT COUNT')) {
            return { 'COUNT(*)': Array.from(this.posts.values()).length };
        }
        return null;
    }

    async all(sql, params = []) {
        if (sql.includes('SELECT posts') && sql.includes('FROM posts')) {
            const posts = Array.from(this.posts.values()).map(post => {
                const user = this.users.get(post.userId);
                return {
                    id: post.id,
                    content: post.content,
                    imageData: post.imageData,
                    videoData: post.videoData,
                    createdAt: post.createdAt,
                    userId: user?.id,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    username: user?.username,
                    profilePicture: user?.profilePicture,
                    likeCount: Array.from(this.post_likes.values()).filter(l => l.postId === post.id).length,
                    repostCount: Array.from(this.post_reposts.values()).filter(r => r.postId === post.id).length,
                    replyCount: post.replyCount || 0,
                    commentCount: Array.from(this.post_comments.values()).filter(c => c.postId === post.id).length,
                    repostedByUserId: null,
                    repostedByFirstName: null,
                    repostedByLastName: null,
                    repostedByUsername: null,
                    sortTime: post.createdAt
                };
            });
            return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sql.includes('SELECT') && sql.includes('FROM post_comments')) {
            const [postId] = params;
            const comments = Array.from(this.post_comments.values())
                .filter(c => c.postId === postId)
                .map(c => {
                    const user = this.users.get(c.userId);
                    return {
                        id: c.id,
                        postId: c.postId,
                        userId: user?.id,
                        firstName: user?.firstName,
                        lastName: user?.lastName,
                        username: user?.username,
                        profilePicture: user?.profilePicture,
                        content: c.content,
                        createdAt: c.createdAt
                    };
                });
            return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return [];
    }
}

module.exports = MemoryDatabase;
