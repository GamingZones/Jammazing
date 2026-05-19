const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Timeout wrapper for Firebase operations
function withTimeout(promise, timeoutMs = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

// Initialize Firebase Admin SDK
let db = null;
let auth = null;

async function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            db = admin.database();
            auth = admin.auth();
            console.log('✅ Firebase already initialized');
            return true;
        }

        // Get Firebase credentials from environment variables
        const serviceAccount = {
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: 'firebase-client-id',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token'
        };

        // Validate required credentials
        console.log('🔍 Checking Firebase credentials:');
        console.log('  PROJECT_ID:', serviceAccount.project_id ? '✅ present' : '❌ MISSING');
        console.log('  CLIENT_EMAIL:', serviceAccount.client_email ? '✅ present' : '❌ MISSING');
        console.log('  PRIVATE_KEY:', serviceAccount.private_key ? `✅ present (${serviceAccount.private_key.length} chars)` : '❌ MISSING');
        console.log('  DATABASE_URL:', process.env.FIREBASE_DATABASE_URL ? '✅ present' : '❌ MISSING');
        
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
            console.error('⚠️ Firebase credentials missing in environment variables');
            console.error('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_DATABASE_URL');
            return false;
        }

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        db = admin.database();
        auth = admin.auth();

        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.error('Error details:', error.stack);
        return false;
    }
}

// Database class that wraps Firebase operations
class FirebaseDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async initialize() {
        const success = await initializeFirebase();
        this.db = db;
        this.initialized = success;
        return success;
    }

    // USERS Operations
    async createUser(userData) {
        try {
            console.log('📝 Starting createUser for:', userData.email);
            const userId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const user = {
                id: userId,
                ...userData,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            // Store in database with timeout
            console.log('📤 Writing user to Firebase...');
            await withTimeout(this.db.ref(`users/${userId}`).set(user), 5000);
            console.log('✅ User data written');
            
            // Create email index for lookups
            console.log('📤 Writing email index...');
            await withTimeout(this.db.ref(`users_by_email/${this.encodeEmail(userData.email)}`).set(userId), 5000);
            console.log('✅ Email index written');
            
            // Create username index
            console.log('📤 Writing username index...');
            await withTimeout(this.db.ref(`users_by_username/${userData.username}`).set(userId), 5000);
            console.log('✅ Username index written');

            console.log(`✅ User created successfully: ${userId}`);
            return user;
        } catch (error) {
            console.error('❌ Error creating user:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const userId = (await this.db.ref(`users_by_email/${this.encodeEmail(email)}`).once('value')).val();
            if (!userId) return null;
            
            const user = (await this.db.ref(`users/${userId}`).once('value')).val();
            return user;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    async getUserByUsername(username) {
        try {
            const userId = (await this.db.ref(`users_by_username/${username}`).once('value')).val();
            if (!userId) return null;
            
            const user = (await this.db.ref(`users/${userId}`).once('value')).val();
            return user;
        } catch (error) {
            console.error('Error getting user by username:', error);
            return null;
        }
    }

    async getUserById(userId) {
        try {
            const user = (await this.db.ref(`users/${userId}`).once('value')).val();
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    async updateUser(userId, updates) {
        try {
            updates.updatedAt = new Date().toISOString();
            await this.db.ref(`users/${userId}`).update(updates);
            console.log(`✅ User updated: ${userId}`);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const users = (await this.db.ref('users').once('value')).val();
            return users ? Object.values(users) : [];
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    // USER PROFILES Operations
    async createUserProfile(userId, profileData) {
        try {
            const profileId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const profile = {
                id: profileId,
                userId,
                ...profileData,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await this.db.ref(`userProfiles/${profileId}`).set(profile);
            await this.db.ref(`users/${userId}/profile`).set(profileId);
            
            console.log(`✅ User profile created: ${profileId}`);
            return profile;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            const profileId = (await this.db.ref(`users/${userId}/profile`).once('value')).val();
            if (!profileId) return null;
            
            const profile = (await this.db.ref(`userProfiles/${profileId}`).once('value')).val();
            return profile;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // QUIZZES Operations
    async createQuiz(quizData) {
        try {
            const quizId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const quiz = {
                id: quizId,
                ...quizData,
                questions: {},
                totalQuestions: 0,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await this.db.ref(`quizzes/${quizId}`).set(quiz);
            await this.db.ref(`users/${quizData.creatorId}/createdQuizzes/${quizId}`).set(true);
            
            console.log(`✅ Quiz created: ${quizId}`);
            return quiz;
        } catch (error) {
            console.error('Error creating quiz:', error);
            throw error;
        }
    }

    async getQuizById(quizId) {
        try {
            const quiz = (await this.db.ref(`quizzes/${quizId}`).once('value')).val();
            return quiz;
        } catch (error) {
            console.error('Error getting quiz:', error);
            return null;
        }
    }

    async addQuestionToQuiz(quizId, questionData) {
        try {
            const questionId = this.generateId();
            const question = {
                id: questionId,
                quizId,
                ...questionData,
                options: {},
                createdAt: new Date().toISOString()
            };

            await this.db.ref(`quizzes/${quizId}/questions/${questionId}`).set(question);
            await this.db.ref(`quizzes/${quizId}/totalQuestions`).set(
                (await this.db.ref(`quizzes/${quizId}/totalQuestions`).once('value')).val() + 1
            );
            
            return question;
        } catch (error) {
            console.error('Error adding question:', error);
            throw error;
        }
    }

    async addOptionToQuestion(quizId, questionId, optionData) {
        try {
            const optionId = this.generateId();
            const option = {
                id: optionId,
                ...optionData
            };

            await this.db.ref(`quizzes/${quizId}/questions/${questionId}/options/${optionId}`).set(option);
            return option;
        } catch (error) {
            console.error('Error adding option:', error);
            throw error;
        }
    }

    // QUIZ ATTEMPTS Operations
    async createQuizAttempt(attemptData) {
        try {
            const attemptId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const attempt = {
                id: attemptId,
                ...attemptData,
                startedAt: timestamp,
                passed: attemptData.score >= (attemptData.passingScore || 70)
            };

            await this.db.ref(`quizAttempts/${attemptId}`).set(attempt);
            await this.db.ref(`users/${attemptData.studentId}/quizAttempts/${attemptId}`).set(true);
            await this.db.ref(`quizzes/${attemptData.quizId}/attempts/${attemptId}`).set(true);
            
            return attempt;
        } catch (error) {
            console.error('Error creating quiz attempt:', error);
            throw error;
        }
    }

    // LIVE STREAMS Operations
    async createLiveStream(streamData) {
        try {
            const streamId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const stream = {
                id: streamId,
                ...streamData,
                isLive: false,
                viewerCount: 0,
                viewers: {},
                chatMessages: {},
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await this.db.ref(`liveStreams/${streamId}`).set(stream);
            await this.db.ref(`users/${streamData.streamerId}/liveStreams/${streamId}`).set(true);
            
            console.log(`✅ Live stream created: ${streamId}`);
            return stream;
        } catch (error) {
            console.error('Error creating live stream:', error);
            throw error;
        }
    }

    async getLiveStreamById(streamId) {
        try {
            const stream = (await this.db.ref(`liveStreams/${streamId}`).once('value')).val();
            return stream;
        } catch (error) {
            console.error('Error getting live stream:', error);
            return null;
        }
    }

    async addStreamViewer(streamId, viewerId) {
        try {
            const timestamp = new Date().toISOString();
            await this.db.ref(`liveStreams/${streamId}/viewers/${viewerId}`).set({
                joinedAt: timestamp,
                leftAt: null
            });
            
            // Update viewer count
            const currentCount = (await this.db.ref(`liveStreams/${streamId}/viewerCount`).once('value')).val() || 0;
            await this.db.ref(`liveStreams/${streamId}/viewerCount`).set(currentCount + 1);
            
            return true;
        } catch (error) {
            console.error('Error adding stream viewer:', error);
            throw error;
        }
    }

    async removeStreamViewer(streamId, viewerId) {
        try {
            const timestamp = new Date().toISOString();
            await this.db.ref(`liveStreams/${streamId}/viewers/${viewerId}/leftAt`).set(timestamp);
            
            // Decrement viewer count
            const currentCount = (await this.db.ref(`liveStreams/${streamId}/viewerCount`).once('value')).val() || 1;
            await this.db.ref(`liveStreams/${streamId}/viewerCount`).set(Math.max(0, currentCount - 1));
            
            return true;
        } catch (error) {
            console.error('Error removing stream viewer:', error);
            throw error;
        }
    }

    // STREAM CHAT Operations
    async addStreamChatMessage(streamId, messageData) {
        try {
            const messageId = this.generateId();
            const message = {
                id: messageId,
                streamId,
                ...messageData,
                createdAt: new Date().toISOString()
            };

            await this.db.ref(`liveStreams/${streamId}/chatMessages/${messageId}`).set(message);
            return message;
        } catch (error) {
            console.error('Error adding stream chat message:', error);
            throw error;
        }
    }

    async getStreamChatMessages(streamId) {
        try {
            const messages = (await this.db.ref(`liveStreams/${streamId}/chatMessages`).once('value')).val();
            return messages ? Object.values(messages) : [];
        } catch (error) {
            console.error('Error getting stream chat messages:', error);
            return [];
        }
    }

    // MESSAGES Operations
    async createMessage(messageData) {
        try {
            const messageId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const message = {
                id: messageId,
                ...messageData,
                isRead: false,
                createdAt: timestamp
            };

            await this.db.ref(`messages/${messageId}`).set(message);
            await this.db.ref(`users/${messageData.senderId}/sentMessages/${messageId}`).set(true);
            if (messageData.recipientId) {
                await this.db.ref(`users/${messageData.recipientId}/receivedMessages/${messageId}`).set(true);
            }
            
            return message;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    async getConversation(userId1, userId2) {
        try {
            // Create a sorted key for the conversation
            const key = [userId1, userId2].sort().join('_');
            const conversation = (await this.db.ref(`conversations/${key}`).once('value')).val();
            return conversation || null;
        } catch (error) {
            console.error('Error getting conversation:', error);
            return null;
        }
    }

    async createConversation(participant1Id, participant2Id) {
        try {
            const conversationId = this.generateId();
            const timestamp = new Date().toISOString();
            const key = [participant1Id, participant2Id].sort().join('_');
            
            const conversation = {
                id: conversationId,
                participant1Id,
                participant2Id,
                lastMessageAt: null,
                messages: {},
                createdAt: timestamp
            };

            await this.db.ref(`conversations/${key}`).set(conversation);
            return conversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    // BACKING TRACKS Operations
    async createBackingTrack(trackData) {
        try {
            const trackId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const track = {
                id: trackId,
                ...trackData,
                playCount: 0,
                isFeatured: false,
                createdAt: timestamp
            };

            await this.db.ref(`backingTracks/${trackId}`).set(track);
            await this.db.ref(`users/${trackData.uploaderId}/backingTracks/${trackId}`).set(true);
            
            return track;
        } catch (error) {
            console.error('Error creating backing track:', error);
            throw error;
        }
    }

    async getBackingTrackById(trackId) {
        try {
            const track = (await this.db.ref(`backingTracks/${trackId}`).once('value')).val();
            return track;
        } catch (error) {
            console.error('Error getting backing track:', error);
            return null;
        }
    }

    // NOTIFICATIONS Operations
    async createNotification(notificationData) {
        try {
            const notificationId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const notification = {
                id: notificationId,
                ...notificationData,
                isRead: false,
                createdAt: timestamp
            };

            await this.db.ref(`notifications/${notificationId}`).set(notification);
            await this.db.ref(`users/${notificationData.userId}/notifications/${notificationId}`).set(true);
            
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async getUserNotifications(userId) {
        try {
            const notificationIds = (await this.db.ref(`users/${userId}/notifications`).once('value')).val();
            if (!notificationIds) return [];
            
            const notifications = [];
            for (const notificationId of Object.keys(notificationIds)) {
                const notification = (await this.db.ref(`notifications/${notificationId}`).once('value')).val();
                if (notification) notifications.push(notification);
            }
            
            return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return [];
        }
    }

    // FOLLOWERS Operations
    async addFollower(followerId, followingId) {
        try {
            const relationshipId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const relationship = {
                id: relationshipId,
                followerId,
                followingId,
                createdAt: timestamp
            };

            // Store relationship
            await this.db.ref(`followers/${relationshipId}`).set(relationship);
            
            // Add to followers list
            await this.db.ref(`users/${followingId}/followers/${followerId}`).set(timestamp);
            
            // Add to following list
            await this.db.ref(`users/${followerId}/following/${followingId}`).set(timestamp);
            
            return relationship;
        } catch (error) {
            console.error('Error adding follower:', error);
            throw error;
        }
    }

    async removeFollower(followerId, followingId) {
        try {
            await this.db.ref(`users/${followingId}/followers/${followerId}`).remove();
            await this.db.ref(`users/${followerId}/following/${followingId}`).remove();
            return true;
        } catch (error) {
            console.error('Error removing follower:', error);
            throw error;
        }
    }

    // POSTS Operations
    async createPost(postData) {
        try {
            const postId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const post = {
                id: postId,
                ...postData,
                comments: {},
                likes: {},
                reposts: {},
                createdAt: timestamp
            };

            await this.db.ref(`posts/${postId}`).set(post);
            await this.db.ref(`users/${postData.userId}/posts/${postId}`).set(true);
            
            return post;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    async getPostById(postId) {
        try {
            const post = (await this.db.ref(`posts/${postId}`).once('value')).val();
            return post;
        } catch (error) {
            console.error('Error getting post:', error);
            return null;
        }
    }

    async addCommentToPost(postId, commentData) {
        try {
            const commentId = this.generateId();
            const comment = {
                id: commentId,
                ...commentData,
                createdAt: new Date().toISOString()
            };

            await this.db.ref(`posts/${postId}/comments/${commentId}`).set(comment);
            return comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    async likePost(postId, userId) {
        try {
            await this.db.ref(`posts/${postId}/likes/${userId}`).set(new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Error liking post:', error);
            throw error;
        }
    }

    // RATINGS Operations
    async addRating(ratingData) {
        try {
            const ratingId = this.generateId();
            const timestamp = new Date().toISOString();
            
            const rating = {
                id: ratingId,
                ...ratingData,
                createdAt: timestamp
            };

            await this.db.ref(`ratings/${ratingId}`).set(rating);
            
            // Add to user's ratings
            await this.db.ref(`users/${ratingData.userId}/ratings/${ratingId}`).set(true);
            
            return rating;
        } catch (error) {
            console.error('Error adding rating:', error);
            throw error;
        }
    }

    // LEARNING PROGRESS Operations
    async updateLearningProgress(studentId, topicName, progressData) {
        try {
            const timestamp = new Date().toISOString();
            const progressId = `${studentId}_${topicName}`;
            
            const progress = {
                id: progressId,
                studentId,
                topicName,
                ...progressData,
                lastAccessedAt: timestamp
            };

            await this.db.ref(`learningProgress/${progressId}`).set(progress);
            return progress;
        } catch (error) {
            console.error('Error updating learning progress:', error);
            throw error;
        }
    }

    async getLearningProgress(studentId) {
        try {
            const progress = (await this.db.ref('learningProgress').orderByChild('studentId').equalTo(studentId).once('value')).val();
            return progress ? Object.values(progress) : [];
        } catch (error) {
            console.error('Error getting learning progress:', error);
            return [];
        }
    }

    // Helper Methods
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    encodeEmail(email) {
        return email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
    }

    decodeEmail(encoded) {
        return encoded.replace(/_at_/g, '@').replace(/_dot_/g, '.');
    }

    async clearDatabase() {
        try {
            await this.db.ref().remove();
            console.log('✅ Database cleared');
            return true;
        } catch (error) {
            console.error('Error clearing database:', error);
            return false;
        }
    }
}

module.exports = {
    initializeFirebase,
    FirebaseDatabase,
    getFirebaseInstance: () => ({ db, auth })
};
