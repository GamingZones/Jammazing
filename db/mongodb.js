const { MongoClient, ObjectId } = require('mongodb');

let mongoClient = null;
let db = null;

async function initializeMongoDB() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.error('MONGODB_URI not set');
            return false;
        }

        mongoClient = new MongoClient(mongoUri, {
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 3000,
            connectTimeoutMS: 3000
        });

        // Add timeout wrapper
        const connectPromise = mongoClient.connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
        
        db = mongoClient.db('jammazing');
        console.log('✅ MongoDB connected');
        return true;
        
    } catch (error) {
        console.error('MongoDB error:', error.message);
        return false;
    }
}

class MongoDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        const success = await initializeMongoDB();
        this.db = db;
        this.initialized = success;
        return success;
    }

    // USERS Operations
    async createUser(userData) {
        const user = {
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const result = await this.db.collection('users').insertOne(user);
            user._id = result.insertedId;
            return user;
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key error
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`${field} already exists`);
            }
            throw error;
        }
    }

    async getUserByEmail(email) {
        return await this.db.collection('users').findOne({ email });
    }

    async getUserByUsername(username) {
        return await this.db.collection('users').findOne({ username });
    }

    async getUserById(id) {
        try {
            return await this.db.collection('users').findOne({ _id: new ObjectId(id) });
        } catch (e) {
            return null;
        }
    }

    async getAllUsers() {
        return await this.db.collection('users').find({}).toArray();
    }

    async updateUser(userId, updates) {
        updates.updatedAt = new Date();
        await this.db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );
        return true;
    }

    async deleteUser(userId) {
        await this.db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        return true;
    }

    // QUIZ Operations
    async createQuiz(quizData) {
        const result = await this.db.collection('quizzes').insertOne({
            ...quizData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result.insertedId;
    }

    async addQuestionToQuiz(quizId, question) {
        await this.db.collection('quizzes').updateOne(
            { _id: new ObjectId(quizId) },
            { $push: { questions: question } }
        );
        return true;
    }

    async recordAttempt(quizId, userId, attempt) {
        await this.db.collection('quiz_attempts').insertOne({
            quizId: new ObjectId(quizId),
            userId: new ObjectId(userId),
            ...attempt,
            createdAt: new Date()
        });
        return true;
    }

    // LIVE STREAMS Operations
    async createLiveStream(streamData) {
        const result = await this.db.collection('live_streams').insertOne({
            ...streamData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result.insertedId;
    }

    async addStreamViewer(streamId, userId) {
        await this.db.collection('live_streams').updateOne(
            { _id: new ObjectId(streamId) },
            { $addToSet: { viewers: new ObjectId(userId) } }
        );
        return true;
    }

    async addStreamChatMessage(streamId, message) {
        await this.db.collection('stream_chats').insertOne({
            streamId: new ObjectId(streamId),
            ...message,
            createdAt: new Date()
        });
        return true;
    }

    // MESSAGES Operations
    async createMessage(messageData) {
        const result = await this.db.collection('messages').insertOne({
            ...messageData,
            createdAt: new Date()
        });
        return result.insertedId;
    }

    async getConversation(userId1, userId2) {
        return await this.db.collection('messages').find({
            $or: [
                { from: userId1, to: userId2 },
                { from: userId2, to: userId1 }
            ]
        }).sort({ createdAt: -1 }).toArray();
    }

    async markAsRead(messageId) {
        await this.db.collection('messages').updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { read: true } }
        );
        return true;
    }

    // BACKING TRACKS Operations
    async createBackingTrack(trackData) {
        const result = await this.db.collection('backing_tracks').insertOne({
            ...trackData,
            playCount: 0,
            createdAt: new Date()
        });
        return result.insertedId;
    }

    async searchBackingTracks(query) {
        return await this.db.collection('backing_tracks').find({
            $text: { $search: query }
        }).toArray();
    }

    async incrementPlayCount(trackId) {
        await this.db.collection('backing_tracks').updateOne(
            { _id: new ObjectId(trackId) },
            { $inc: { playCount: 1 } }
        );
        return true;
    }

    // NOTIFICATIONS Operations
    async createNotification(notifData) {
        const result = await this.db.collection('notifications').insertOne({
            ...notifData,
            read: false,
            createdAt: new Date()
        });
        return result.insertedId;
    }

    async getUserNotifications(userId) {
        return await this.db.collection('notifications').find({
            userId: new ObjectId(userId)
        }).sort({ createdAt: -1 }).toArray();
    }

    async getUnreadCount(userId) {
        return await this.db.collection('notifications').countDocuments({
            userId: new ObjectId(userId),
            read: false
        });
    }
}

module.exports = MongoDatabase;
