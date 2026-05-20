const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import In-Memory Database and Models
const MemoryDatabase = require('./db/memory');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const LiveStream = require('./models/LiveStream');
const Message = require('./models/Message');
const BackingTrack = require('./models/BackingTrack');
const Notification = require('./models/Notification');
const quizzesService = require('./db/quizzes');
const questionBank = require('./db/questionBank');

const app = express();
const server = http.createServer(app);

// Configure CORS origins for different environments
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://jammazing.vercel.app'
];

// Allow all origins in development
if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('*');
}

const io = socketIO(server, {
    cors: { 
        origin: allowedOrigins, 
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(bodyParser.json({ strict: false, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Static Files - Serve CSS, JS, and other assets
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/Pages', express.static(path.join(__dirname, 'Pages')));

// Also serve from root for other assets
app.use(express.static(path.join(__dirname)));

// Database Instance
let db;
let userModel = null;
let quizModel = null;
let liveStreamModel = null;
let messageModel = null;
let backingTrackModel = null;
let notificationModel = null;
let dbInitialized = false;
let dbInitPromise = null;

// In-memory tracking of active streams (for real-time updates)
const activeStreams = new Map(); // key: streamerId, value: stream data

// Initialize Database on server start
async function initializeApp() {
    if (dbInitialized) return Promise.resolve();
    if (dbInitPromise) return dbInitPromise;
    
    dbInitPromise = (async () => {
        try {
            // Initialize In-Memory Database
            db = new MemoryDatabase();
            const initialized = await db.initialize();
            
            if (!initialized) {
                console.error('❌ In-Memory Database initialization failed');
                dbInitialized = false;
            } else {
                // Initialize Models
                userModel = new User(db);
                quizModel = new Quiz(db);
                liveStreamModel = new LiveStream(db);
                messageModel = new Message(db);
                backingTrackModel = new BackingTrack(db);
                notificationModel = new Notification(db);
                
                dbInitialized = true;
                console.log('✅ In-Memory Database and models initialized successfully');
            }
            
        } catch (error) {
            console.error('⚠️ Database initialization error:', error.message);
            dbInitialized = false;
        }
    })();
    
    return dbInitPromise;
}

// Start database initialization in background (don't wait for it)
console.log('🔧 Initializing database on server startup...');
initializeApp().catch(err => console.error('Init error:', err.message));

// Middleware to ensure database is initialized before handling requests
app.use(async (req, res, next) => {
    // Only wait for database on POST requests that need it
    if ((req.method === 'POST' || req.method === 'PUT') && !dbInitialized && dbInitPromise) {
        try {
            await Promise.race([
                dbInitPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);
        } catch (err) {
            console.error('Database wait error:', err.message);
        }
    }
    next();
});
// Root endpoint
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'Pages', 'index.html'));
    } catch (err) {
        res.status(500).json({ error: 'Could not load home page' });
    }
});

// Simple health endpoint that requires no async
app.get('/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// Favicon route (return empty response to avoid 404)
app.get('/favicon.ico', (req, res) => {
    res.status(204).send();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    try {
        res.json({
            status: dbInitialized ? 'ready' : 'waiting',
            database: dbInitialized ? 'connected' : 'connecting',
            mongodb_uri_set: !!process.env.MONGODB_URI,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== USER ROUTES ====================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        // Check if database is initialized
        if (!dbInitialized || !userModel) {
            console.warn('Register called but database not initialized');
            return res.status(503).json({ error: 'Database initializing. Please try again in a few moments.' });
        }
        
        const { firstName, lastName, email, username, password, accountType, instrument } = req.body;
        
        if (!firstName || !lastName || !email || !username || !password || !accountType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        try {
            const existingUser = await userModel.getByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'Email already registered' });
            }
        } catch (checkErr) {
            console.error('Email check failed:', checkErr.message);
            return res.status(500).json({ error: 'Could not validate email' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const result = await userModel.create({
            firstName,
            lastName,
            email,
            username,
            password: hashedPassword,
            accountType,
            instrument: instrument || ''
        });
        
        res.status(201).json({
            message: 'User registered successfully',
            userId: result._id || result.id
        });
        
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        if (!userModel) {
            return res.status(503).json({ error: 'Database not initialized. Please try again in a moment.' });
        }
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        // Find user by email
        const user = await userModel.getByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        res.json({
            message: 'Login successful',
            userId: user.id,
            token: 'temp_token_' + user.id,
            accountType: user.accountType,
            firstName: user.firstName,
            lastName: user.lastName
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        if (!userModel || !dbInitialized) {
            // Return empty array if database not ready (don't crash frontend)
            return res.json([]);
        }
        
        const { accountType } = req.query;
        const users = accountType
            ? await userModel.getUsersByAccountType(accountType)
            : await userModel.getAll();
        
        // Remove passwords from response
        const safeUsers = users.map(u => {
            const { password, ...safe } = u;
            return safe;
        });
        
        res.json(safeUsers);
    } catch (error) {
        console.error('Get users error:', error);
        res.json([]); // Return empty array on error
    }
});

// Follow user
app.post('/api/users/:id/follow', async (req, res) => {
    try {
        const { userId } = req.body;
        const followingId = req.params.id;
        
        if (!userId || !followingId) {
            return res.status(400).json({ error: 'userId and followingId are required' });
        }
        
        if (userId === Number(followingId)) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        await db.run(
            'INSERT OR IGNORE INTO followers (followerId, followingId) VALUES (?, ?)',
            [userId, followingId]
        );
        
        res.json({ message: 'User followed successfully' });
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unfollow user
app.post('/api/users/:id/unfollow', async (req, res) => {
    try {
        const { userId } = req.body;
        const followingId = req.params.id;
        
        if (!userId || !followingId) {
            return res.status(400).json({ error: 'userId and followingId are required' });
        }
        
        await db.run(
            'DELETE FROM followers WHERE followerId = ? AND followingId = ?',
            [userId, followingId]
        );
        
        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check if user follows another user
app.get('/api/users/:id/followers/check', async (req, res) => {
    try {
        const { userId } = req.query;
        const followingId = req.params.id;
        
        if (!userId || !followingId) {
            return res.status(400).json({ error: 'userId and followingId are required' });
        }
        
        const follow = await db.get(
            'SELECT id FROM followers WHERE followerId = ? AND followingId = ?',
            [userId, followingId]
        );
        
        res.json({ isFollowing: !!follow });
    } catch (error) {
        console.error('Check follow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user posts
app.get('/api/users/:id/posts', async (req, res) => {
    try {
        const userId = req.params.id;
        const posts = await db.all(`
            SELECT posts.id, posts.content, posts.imageData, posts.videoData, posts.createdAt,
                   users.id AS userId, users.firstName, users.lastName, users.username, users.profilePicture,
                   (SELECT COUNT(*) FROM post_comments WHERE post_comments.postId = posts.id) AS commentCount,
                   (SELECT COUNT(*) FROM post_reposts WHERE post_reposts.postId = posts.id) AS repostCount
            FROM posts
            JOIN users ON posts.userId = users.id
            WHERE posts.userId = ?
            ORDER BY posts.createdAt DESC
            LIMIT 50
        `, [userId]);
        res.json(posts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update profile picture
app.post('/api/users/:id/profile-picture', async (req, res) => {
    try {
        const userId = req.params.id;
        const { profilePicture } = req.body;
        if (!profilePicture) return res.status(400).json({ error: 'No image provided' });
        const user = await userModel.getById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await userModel.update(userId, { profilePicture });
        res.json({ message: 'Profile picture updated', profilePicture });
    } catch (error) {
        console.error('Profile picture update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/users/:id', async (req, res) => {
    try {
        if (!userModel || !dbInitialized) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = await userModel.getById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...safe } = user;
        res.json(safe);
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(404).json({ error: 'User not found' });
    }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const { firstName, lastName, bio, instrument } = req.body;
        const userId = req.params.id;
        console.log('PUT /api/users/:id called');
        console.log('User ID:', userId);
        console.log('Request body:', { firstName, lastName, bio, instrument });
        
        // Check if user exists
        const user = await userModel.getById(userId);
        console.log('Found user:', user);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update user
        const result = await userModel.update(userId, {
            firstName,
            lastName,
            bio,
            instrument
        });
        
        console.log('Update result:', result);
        
        // Verify the update
        const updatedUser = await userModel.getById(userId);
        console.log('Updated user:', updatedUser);
        
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        await userModel.delete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all instructors
app.get('/api/instructors', async (req, res) => {
    try {
        const instructors = await userModel.getInstructors();
        res.json(instructors);
    } catch (error) {
        console.error('Get instructors error:', error);
        res.status(500).json({ error: error.message });
    }
});


// ==================== QUIZ ROUTES ====================

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
    try {
        const quizzes = quizzesService.getAllQuizzes();
        
        // Add creator name to each quiz
        const quizzesWithCreators = quizzes.map(quiz => {
            const creator = db.users.get(quiz.creatorId);
            return {
                ...quiz,
                id: quiz._id || quiz.id,
                creatorName: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'
            };
        });
        
        res.json(quizzesWithCreators);
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save quiz with generated questions (must come before :quizId route)
// Helper function to map difficulty levels
function mapDifficultyLevel(level) {
    const map = {
        'beginner': 'easy',
        'intermediate': 'medium',
        'advanced': 'hard',
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard'
    };
    return map[level] || 'easy';
}

app.post('/api/quizzes/save-with-questions', async (req, res) => {
    try {
        const { title, description, creatorId, quizType, difficultyLevel, timeLimit, totalQuestions, questions, isPublished } = req.body;

        // Map difficulty level to database format
        const mappedDifficultyLevel = mapDifficultyLevel(difficultyLevel);

        // Create quiz with questions
        const quizId = quizzesService.createQuiz({
            title,
            description,
            creatorId,
            quizType,
            difficultyLevel: mappedDifficultyLevel,
            timeLimit,
            totalQuestions,
            isPublished: isPublished ? true : false,
            passingScore: 70,
            questions: Array.isArray(questions) ? questions.map((q, index) => ({
                id: `q_${index}`,
                question: q.question,
                options: q.options || [],
                answer: q.answer,
                type: 'multiple_choice',
                orderIndex: index + 1
            })) : []
        });

        res.status(201).json({
            message: 'Quiz saved successfully',
            quizId
        });
    } catch (error) {
        console.error('Save quiz error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get quizzes by creator (must come before :quizId route)
app.get('/api/quizzes/creator/:creatorId', async (req, res) => {
    try {
        const quizzes = quizzesService.getQuizzesByCreator(req.params.creatorId);
        res.json(quizzes);
    } catch (error) {
        console.error('Get creator quizzes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete quiz (creator only)
app.delete('/api/quizzes/:quizId', async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const userId = req.query.userId || req.body.userId;

        const quiz = quizzesService.getQuiz(quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        if (String(quiz.creatorId) !== String(userId)) {
            return res.status(403).json({ error: 'Not authorized to delete this quiz' });
        }

        quizzesService.deleteQuiz(quizId);
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get a specific quiz with questions (must come after more specific routes)
app.get('/api/quizzes/:quizId', async (req, res) => {
    try {
        let quiz = quizzesService.getQuiz(req.params.quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // If quiz has no questions, generate them from question bank
        if (!quiz.questions || quiz.questions.length === 0) {
            const generatedQuestions = generateRandomQuizQuestions({
                category: quiz.quizType || 'general',
                difficultyLevel: quiz.difficultyLevel || 'beginner',
                questionCount: quiz.totalQuestions || 10
            });
            quiz.questions = generatedQuestions;
        }

        // Return quiz with its questions
        res.json({
            ...quiz,
            questions: quiz.questions || []
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: error.message });
    }
});

function shuffleArray(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function difficultyPrefix(difficultyLevel) {
    const map = {
        beginner: 'BEGINNER',
        intermediate: 'INTERMEDIATE',
        advanced: 'ADVANCED'
    };
    return map[difficultyLevel] || 'BEGINNER';
}

function buildGeneralQuestionBank(difficultyLevel) {
    return [
        {
            stem: `Which note is the relative minor of C major?`,
            correct: 'A minor',
            distractors: ['E minor', 'D minor', 'F minor']
        },
        {
            stem: `What does tempo describe in music?`,
            correct: 'The speed of the beat',
            distractors: ['The key signature', 'The lyric language', 'The instrument brand']
        },
        {
            stem: `In 4/4 time, how many quarter-note beats are in one bar?`,
            correct: '4 beats',
            distractors: ['2 beats', '3 beats', '8 beats']
        },
        {
            stem: `What is a chord progression?`,
            correct: 'An ordered sequence of chords',
            distractors: ['A list of drum rudiments', 'A vocal warm-up scale', 'A microphone setup']
        },
        {
            stem: `Which symbol raises a note by a semitone?`,
            correct: 'Sharp (♯)',
            distractors: ['Flat (♭)', 'Natural (♮)', 'Fermata']
        },
        {
            stem: `What does dynamics refer to?`,
            correct: 'The loudness and softness of music',
            distractors: ['The song release date', 'The instrument tuning app', 'The genre popularity']
        },
        {
            stem: `Which interval spans 7 semitones?`,
            correct: 'Perfect fifth',
            distractors: ['Major third', 'Perfect fourth', 'Minor sixth']
        },
        {
            stem: `What is syncopation?`,
            correct: 'Emphasizing normally weak beats or offbeats',
            distractors: ['Playing only in major keys', 'Using only slow tempos', 'Avoiding rhythm changes']
        }
    ];
}

function buildInstrumentQuestionBank(difficultyLevel, selectedInstruments = []) {
    const selected = new Set(
        (Array.isArray(selectedInstruments) ? selectedInstruments : [])
            .map(i => String(i).trim().toLowerCase())
            .filter(Boolean)
    );

    const allInstrumentQuestions = [
        // Piano
        {
            instrument: 'piano',
            stem: `On piano, a triad consists of:`,
            correct: 'Three distinct chord tones',
            distractors: ['Two notes only', 'Five notes always', 'Any random cluster']
        },
        {
            instrument: 'piano',
            stem: `What is middle C commonly called in scientific pitch notation?`,
            correct: 'C4',
            distractors: ['C3', 'C5', 'B3']
        },

        // Guitar
        {
            instrument: 'guitar',
            stem: `On a standard guitar, how many strings are there?`,
            correct: '6',
            distractors: ['4', '5', '7']
        },
        {
            instrument: 'guitar',
            stem: `Standard guitar tuning from lowest to highest starts with:`,
            correct: 'E',
            distractors: ['A', 'D', 'G']
        },

        // Bass
        {
            instrument: 'bass',
            stem: `Which bass technique alternates index and middle fingers on plucking hand?`,
            correct: 'Alternate picking',
            distractors: ['Slap and pop', 'Fretting', 'Tapping']
        }
    ];

    return Array.from(selected).length > 0 
        ? allInstrumentQuestions.filter(q => selected.has(q.instrument))
        : allInstrumentQuestions.slice(0, 8);
}

function generateAIQuizQuestions({ quizType, difficultyLevel, questionCount, selectedInstruments = [] }) {
    const safeCount = Math.max(1, Math.min(parseInt(questionCount, 10) || 5, 20));
    const type = quizType === 'instruments' ? 'instruments' : 'general';
    const difficulty = difficultyLevel || 'beginner';

    const bank = type === 'instruments'
        ? buildInstrumentQuestionBank(difficulty, selectedInstruments)
        : buildGeneralQuestionBank(difficulty);

    const randomizedBank = shuffleArray(bank);
    const questions = [];

    for (let i = 0; i < safeCount; i++) {
        const base = randomizedBank[i % randomizedBank.length];
        const randomizedOptions = shuffleArray([base.correct, ...base.distractors]);

        questions.push({
            question: base.stem,
            options: randomizedOptions,
            answer: base.correct
        });
    }

    return questions;
}


// Create a quiz
app.post('/api/quizzes', async (req, res) => {
    try {
        const { title, description, creatorId, quizType, difficultyLevel, timeLimit } = req.body;
        
        const quizId = quizzesService.createQuiz({
            title,
            description,
            creatorId,
            quizType,
            difficultyLevel,
            timeLimit,
            questions: []
        });
        
        res.status(201).json({
            message: 'Quiz created',
            quizId: quizId
        });
        
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate random questions from question bank with replacement
function generateRandomQuizQuestions({ category, difficultyLevel, questionCount }) {
    const safeCount = Math.max(1, Math.min(parseInt(questionCount, 10) || 5, 50));
    const safeDifficulty = ['beginner', 'intermediate', 'advanced'].includes(difficultyLevel) 
        ? difficultyLevel 
        : 'beginner';
    const safeCategory = ['general', 'piano', 'guitar', 'drums', 'bass'].includes(category)
        ? category
        : 'general';

    const questionPool = questionBank[safeCategory][safeDifficulty];
    if (!questionPool || questionPool.length === 0) {
        return [];
    }

    const questions = [];
    for (let i = 0; i < safeCount; i++) {
        // Pick random question from pool WITH REPLACEMENT (allows repeats)
        const randomIndex = Math.floor(Math.random() * questionPool.length);
        const baseQuestion = questionPool[randomIndex];
        
        questions.push({
            id: `q_${i}`,
            question: baseQuestion.question,
            options: baseQuestion.options,
            answer: baseQuestion.answer,
            type: "multiple_choice",
            orderIndex: i + 1
        });
    }

    return questions;
}

// Generate quiz content with AI-style generator (local deterministic generator)
app.post('/api/quizzes/generate-ai', (req, res) => {
    try {
        const body = (req && req.body && typeof req.body === 'object') ? req.body : {};
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const category = typeof body.quizType === 'string' ? body.quizType.trim() : 'general';
        const difficultyLevel = typeof body.difficultyLevel === 'string' ? body.difficultyLevel.trim() : 'beginner';
        const questionCount = body.questionCount || 10;
        const topicPrompt = typeof body.topicPrompt === 'string' ? body.topicPrompt.trim() : '';

        if (!title || !category || !difficultyLevel) {
            return res.status(400).json({ error: 'title, category (quizType), and difficultyLevel are required' });
        }

        // Generate random questions from question bank with replacement
        const questions = generateRandomQuizQuestions({
            category,
            difficultyLevel,
            questionCount
        });

        return res.status(200).json({
            message: 'Quiz generated from question bank with randomization',
            quiz: {
                title,
                description: `${category} ${difficultyLevel} quiz - ${questions.length} randomized questions`,
                quizType: category,
                difficultyLevel,
                totalQuestions: questions.length,
                questions
            }
        });
    } catch (error) {
        console.error('Quiz generation error:', error);
        return res.status(500).json({ error: 'Generation failed' });
    }
});

// ==================== LIVESTREAM ROUTES ====================

// Create a live stream
app.post('/api/livestreams', async (req, res) => {
    try {
        const { streamerId, title, description, topic } = req.body;
        
        const result = await liveStreamModel.create({
            streamerId,
            title,
            description,
            topic
        });
        
        res.status(201).json({
            message: 'Stream created',
            streamId: result.id
        });
        
    } catch (error) {
        console.error('Create stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active streams
app.get('/api/livestreams/active', async (req, res) => {
    try {
        // Return streams from in-memory map (real-time)
        const result = Array.from(activeStreams.values());
        console.log(`📡 [GET ACTIVE STREAMS] Returning ${result.length} active streams`);
        if (result.length > 0) {
            console.log(`📡 [GET ACTIVE STREAMS] Streams:`, result);
        }
        res.json(result);
    } catch (error) {
        console.error('Get active streams error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start a live stream
app.post('/api/livestreams/start', async (req, res) => {
    try {
        console.log('📡 [STREAM START] Endpoint called with body:', req.body);
        
        const { streamerId, title, description, topic } = req.body;
        console.log(`📡 [STREAM START] Received: streamerId=${streamerId}, title=${title}, topic=${topic}`);
        
        if (!streamerId || !title) {
            console.error('❌ [STREAM START] Missing required fields');
            return res.status(400).json({ error: 'streamerId and title are required' });
        }
        
        console.log('📡 [STREAM START] Creating stream record in database...');
        const result = await liveStreamModel.create({
            streamerId,
            title,
            description,
            topic
        });
        
        const streamId = result.lastID || result.id;
        console.log(`📡 [STREAM START] Stream created with ID: ${streamId}`);
        
        const nowTimestamp = new Date().toISOString();
        await liveStreamModel.startStream(streamId, nowTimestamp);
        console.log(`📡 [STREAM START] Database marked stream as live (isLive=1) with actualStartTime=${nowTimestamp}`);
        
        // Get streamer info
        const user = await userModel.getById(streamerId);
        console.log(`📡 [STREAM START] Fetched user: ${user?.firstName} ${user?.lastName}`);
        
        // Add to in-memory active streams
        const streamData = {
            id: streamId,
            streamerId: streamerId,
            title: title,
            description: description,
            topic: topic,
            streamerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            streamerUsername: user ? user.username : 'unknown',
            streamerPicture: user ? user.profilePicture : null,
            viewerCount: 0,
            startTime: nowTimestamp
        };
        
        activeStreams.set(streamerId, streamData);
        console.log(`✅ [STREAM START] Stream added to in-memory map. Total active: ${activeStreams.size}`);
        console.log(`✅ [STREAM START] Stream started: ${title} by ${user?.firstName} ${user?.lastName} (ID: ${streamId})`);
        console.log(`✅ [STREAM START] activeStreams contents:`, Array.from(activeStreams.entries()));
        
        const responseData = {
            message: 'Stream started',
            streamId: streamId,
            actualStartTime: nowTimestamp
        };
        
        res.status(201).json(responseData);
    } catch (error) {
        console.error('❌ [STREAM START] Error:', error.message);
        console.error('❌ [STREAM START] Full error:', error);
        res.status(500).json({ error: error.message });
    }
});

// End a live stream
app.put('/api/livestreams/:id/end', async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, finalViewerCount } = req.body || {};
        await liveStreamModel.endStream(id);
        
        // Remove from in-memory active streams (find by stream id)
        for (const [key, stream] of activeStreams.entries()) {
            if (stream.id === parseInt(id)) {
                activeStreams.delete(key);
                console.log(`✅ Stream ended: ${stream.title} (Duration: ${duration}s, Final viewers: ${finalViewerCount})}`);
                break;
            }
        }
        
        res.json({ message: 'Stream ended and saved to archives' });
    } catch (error) {
        console.error('End stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a stream (archive)
app.delete('/api/livestreams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete the stream record
        await db.run('DELETE FROM liveStreams WHERE id = ?', [id]);
        
        // Delete associated chat messages
        await db.run('DELETE FROM streamChat WHERE streamId = ?', [id]);
        
        console.log(`🗑️ [STREAM DELETED] Stream ${id} and associated chat deleted`);
        res.json({ message: 'Stream deleted successfully' });
    } catch (error) {
        console.error('Delete stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get archived streams for a specific user
app.get('/api/livestreams/user/:userId/archives', async (req, res) => {
    try {
        const { userId } = req.params;
        const streams = await liveStreamModel.getByStreamer(userId);
        
        // Filter to only ended streams (archived)
        const archived = streams.filter(stream => !stream.isLive && stream.endTime);
        
        // Sort by endTime descending (most recent first)
        archived.sort((a, b) => {
            const aDate = new Date(a.endTime).getTime();
            const bDate = new Date(b.endTime).getTime();
            return bDate - aDate;
        });
        
        console.log(`📦 [ARCHIVES] Fetched ${archived.length} archived streams for user ${userId}`);
        
        res.json(archived);
    } catch (error) {
        console.error('Get archives error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save stream recording
app.post('/api/livestreams/:id/recording', async (req, res) => {
    try {
        const { id } = req.params;
        const { recordingData } = req.body;
        
        if (!recordingData) {
            return res.status(400).json({ error: 'No recording data provided' });
        }
        
        // Convert base64 to buffer if needed
        let buffer = recordingData;
        if (typeof recordingData === 'string') {
            buffer = Buffer.from(recordingData, 'base64');
        } else if (recordingData instanceof Array) {
            buffer = Buffer.from(recordingData);
        }
        
        // Update stream with recording data
        await db.run(
            'UPDATE liveStreams SET recordingData = ? WHERE id = ?',
            [buffer, id]
        );
        
        console.log(`📹 [RECORDING SAVED] Stream ${id} recording saved (${buffer.length} bytes)`);
        
        res.json({ 
            message: 'Recording saved successfully',
            streamId: id,
            recordingSize: buffer.length
        });
    } catch (error) {
        console.error('Save recording error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get stream recording
app.get('/api/livestreams/:id/recording', async (req, res) => {
    try {
        const { id } = req.params;
        const stream = await db.get(
            'SELECT recordingData FROM liveStreams WHERE id = ?',
            [id]
        );
        
        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }
        
        if (!stream.recordingData) {
            return res.status(404).json({ error: 'No recording available for this stream' });
        }
        
        console.log(`📹 [RECORDING RETRIEVED] Stream ${id} recording (${stream.recordingData.length} bytes)`);
        
        // Set appropriate headers for video blob
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader('Content-Length', stream.recordingData.length);
        res.send(stream.recordingData);
    } catch (error) {
        console.error('Get recording error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get stream info by ID
app.get('/api/livestreams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const stream = await liveStreamModel.getById(id);
        
        if (!stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }
        
        // Get streamer info
        const user = await userModel.getById(stream.streamerId);
        
        // Calculate duration
        let streamDuration = 0;
        if (stream.isLive && stream.actualStartTime) {
            // Live stream: calculate from actual start to now
            const startTime = new Date(stream.actualStartTime);
            const now = new Date();
            streamDuration = Math.floor((now - startTime) / 1000);
            
            // If duration is negative or very large (> 24 hours), reset it
            if (streamDuration < 0 || streamDuration > 86400) {
                console.warn(`⚠️ [API] Stream ${id} has invalid duration (${streamDuration}s). Resetting actualStartTime to NOW.`);
                await liveStreamModel.startStream(id, new Date().toISOString());
                streamDuration = 0;
            }
        } else if (!stream.isLive && stream.actualStartTime && stream.endTime) {
            // Archived stream: calculate from start to end
            const startTime = new Date(stream.actualStartTime);
            const endTime = new Date(stream.endTime);
            streamDuration = Math.max(0, Math.floor((endTime - startTime) / 1000));
            
            console.log(`📊 [API ARCHIVE] Stream ${id}: startTime=${stream.actualStartTime}, endTime=${stream.endTime}, duration=${streamDuration}s`);
        } else if (!stream.isLive && stream.endTime) {
            // Fallback for archived streams without proper actualStartTime
            const startTime = new Date(stream.createdAt);
            const endTime = new Date(stream.endTime);
            streamDuration = Math.max(0, Math.floor((endTime - startTime) / 1000));
            
            console.warn(`⚠️ [API] Stream ${id} missing actualStartTime, using createdAt. Duration: ${streamDuration}s`);
        }
        
        // Get actual viewer count from active session
        const streamIdStr = String(id);
        const session = streamSessions.get(streamIdStr);
        const actualViewerCount = session ? session.viewers.size : stream.viewerCount;
        
        console.log(`📊 [API STREAM INFO] Stream ${streamIdStr}: session=${!!session}, viewers=${actualViewerCount}, isLive=${stream.isLive}, dbCount=${stream.viewerCount}, duration=${streamDuration}s`);
        
        res.json({
            ...stream,
            viewerCount: actualViewerCount,
            streamDuration: streamDuration,
            actualStartTime: stream.actualStartTime,
            streamerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            streamerUsername: user ? user.username : 'unknown',
            streamerPicture: user ? user.profilePicture : null
        });
    } catch (error) {
        console.error('Get stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DEBUG: Get session state for a stream
app.get('/api/debug/session/:id', async (req, res) => {
    const { id } = req.params;
    const streamIdStr = String(id);
    const session = streamSessions.get(streamIdStr);
    
    res.json({
        streamId: streamIdStr,
        sessionExists: !!session,
        session: session ? {
            streamerId: session.streamerId,
            streamerSocket: session.streamerSocket,
            viewerCount: session.viewers.size,
            viewers: Array.from(session.viewers.entries()).map(([socketId, userId]) => ({
                socketId,
                userId
            }))
        } : null,
        allSessions: Array.from(streamSessions.entries()).map(([id, s]) => ({
            streamId: id,
            viewers: s.viewers.size
        }))
    });
});

// Get chat messages for a stream
app.get('/api/livestreams/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get messages from database
        const messages = await db.all(
            `SELECT id, senderId, senderName, message, videoOffset, createdAt 
             FROM streamChat 
             WHERE streamId = ? 
             ORDER BY videoOffset ASC 
             LIMIT 50`,
            [id]
        );
        
        if (messages.length > 0) {
            console.log(`📝 [GET CHAT] Stream ${id}: Found ${messages.length} messages`);
        }
        res.json(messages || []);
    } catch (error) {
        // Stream chat table might not exist yet
        console.error(`❌ [GET CHAT] Error: ${error.message}`);
        res.json([]);
    }
});

// Post a chat message to a stream
app.post('/api/livestreams/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        const { senderId, senderName, message, videoOffset } = req.body;
        
        if (!message || !senderName) {
            return res.status(400).json({ error: 'Message and sender name required' });
        }
        
        // Ensure streamChat table exists
        await db.run(`
            CREATE TABLE IF NOT EXISTS streamChat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                streamId INTEGER NOT NULL,
                senderId INTEGER NOT NULL,
                senderName TEXT NOT NULL,
                message TEXT NOT NULL,
                videoOffset REAL DEFAULT 0.0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (streamId) REFERENCES liveStreams(id) ON DELETE CASCADE,
                FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Add videoOffset column if it doesn't exist (migration)
        try {
            await db.run('ALTER TABLE streamChat ADD COLUMN videoOffset REAL DEFAULT 0.0');
        } catch (err) {
            // Column might already exist
        }
        
        // Insert message with videoOffset
        const now = new Date().toISOString();
        const result = await db.run(
            `INSERT INTO streamChat (streamId, senderId, senderName, message, videoOffset, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, senderId, senderName, message, videoOffset || 0, now]
        );
        
        res.status(201).json({
            id: result.id,
            streamId: id,
            senderId: senderId,
            senderName: senderName,
            message: message,
            videoOffset: videoOffset || 0,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== MESSAGE ROUTES ====================

// Send a message
app.post('/api/messages', async (req, res) => {
    try {
        const { senderId, recipientId, messageText } = req.body;
        
        const conversation = await messageModel.getOrCreateConversation(senderId, recipientId);
        
        const result = await messageModel.create({
            senderId,
            recipientId,
            conversationId: conversation.id,
            messageText
        });

        // Create a notification for the recipient
        try {
            const sender = await userModel.getById(senderId);
            if (sender) {
                await notificationModel.create({
                    userId: recipientId,
                    title: 'New Message',
                    message: `${sender.firstName} ${sender.lastName} sent you a message`,
                    notificationType: 'message',
                    relatedId: result.id
                });
            }
        } catch (notifErr) {
            console.error('Notification creation error:', notifErr);
        }

        res.status(201).json({
            message: 'Message sent',
            messageId: result.id
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages between two users
app.get('/api/messages/:otherUserId', async (req, res) => {
    try {
        const userId = req.query.userId;
        const otherUserId = parseInt(req.params.otherUserId);
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required in query' });
        }
        
        // Get conversation between these two users
        const conversation = await messageModel.getOrCreateConversation(userId, otherUserId);
        
        if (!conversation) {
            return res.json([]);
        }
        
        // Get messages for this conversation
        const messages = await messageModel.getConversationMessages(conversation.id);
        res.json(messages || []);
        
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a message
app.delete('/api/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId, deleteForEveryone } = req.body;
        const msg = await messageModel.getById(messageId);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        const isSender = String(msg.senderId) === String(userId);
        if (deleteForEveryone && isSender) {
            // Soft-delete for everyone: replace text with tombstone marker
            await messageModel.softDelete(messageId);
            res.json({ success: true, deletedForEveryone: true });
        } else {
            // Delete only for this user's view — we still soft-delete from DB but mark it
            await messageModel.softDelete(messageId);
            res.json({ success: true, deletedForEveryone: false });
        }
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user conversations
app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const conversations = await messageModel.getUserConversations(req.params.userId);
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== BACKING TRACKS ROUTES ====================

// Get all backing tracks
app.get('/api/backing-tracks', async (req, res) => {
    try {
        const tracks = await backingTrackModel.getAll();
        res.json(tracks);
    } catch (error) {
        console.error('Get tracks error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get popular tracks
app.get('/api/backing-tracks/popular', async (req, res) => {
    try {
        const tracks = await backingTrackModel.getTopTracks(10);
        res.json(tracks);
    } catch (error) {
        console.error('Get popular tracks error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== NOTIFICATION ROUTES ====================

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        if (!notificationModel || !dbInitialized) {
            return res.json([]); // Return empty array if database not ready
        }
        
        const notifications = await notificationModel.getUserNotifications(req.params.userId);
        res.json(notifications || []);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.json([]); // Return empty array on error
    }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running ✅' });
});

// ==================== POSTS ROUTES ====================

// Get all posts (newest first), joined with user info
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await db.get(`
            SELECT p.*, u.firstName, u.lastName, u.username, u.profilePicture,
                (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) as likeCount,
                (SELECT COUNT(*) FROM post_reposts WHERE postId = p.id) as repostCount,
                (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) as commentCount
            FROM posts p JOIN users u ON p.userId = u.id WHERE p.id = ?`, [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const { userId } = req.query;
        // Fetch original posts
        const posts = await db.all(`
            SELECT posts.id, posts.content, posts.imageData, posts.videoData, posts.createdAt,
                   users.id AS userId, users.firstName, users.lastName, users.username, users.profilePicture,
                   (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id) AS likeCount,
                   (SELECT COUNT(*) FROM post_reposts WHERE post_reposts.postId = posts.id) AS repostCount,
                   (SELECT COUNT(*) FROM post_replies WHERE post_replies.postId = posts.id) AS replyCount,
                   (SELECT COUNT(*) FROM post_comments WHERE post_comments.postId = posts.id) AS commentCount,
                   NULL AS repostedByUserId, NULL AS repostedByFirstName, NULL AS repostedByLastName, NULL AS repostedByUsername,
                   posts.createdAt AS sortTime
            FROM posts
            JOIN users ON posts.userId = users.id
        `);
        // Fetch reposts (other users reposting)
        const reposts = await db.all(`
            SELECT posts.id, posts.content, posts.imageData, posts.videoData, posts.createdAt,
                   authors.id AS userId, authors.firstName, authors.lastName, authors.username, authors.profilePicture,
                   (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.id) AS likeCount,
                   (SELECT COUNT(*) FROM post_reposts WHERE post_reposts.postId = posts.id) AS repostCount,
                   (SELECT COUNT(*) FROM post_replies WHERE post_replies.postId = posts.id) AS replyCount,
                   (SELECT COUNT(*) FROM post_comments WHERE post_comments.postId = posts.id) AS commentCount,
                   reposters.id AS repostedByUserId, reposters.firstName AS repostedByFirstName,
                   reposters.lastName AS repostedByLastName, reposters.username AS repostedByUsername,
                   pr.createdAt AS sortTime
            FROM post_reposts pr
            JOIN posts ON pr.postId = posts.id
            JOIN users authors ON posts.userId = authors.id
            JOIN users reposters ON pr.userId = reposters.id
        `);
        // Combine and deduplicate: keep one entry per (postId, reposterId or null)
        const combined = [...posts, ...reposts];
        combined.sort((a, b) => new Date(b.sortTime) - new Date(a.sortTime));
        const seen = new Set();
        const deduplicated = combined.filter(p => {
            const key = `${p.id}-${p.repostedByUserId || 'orig'}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 50);
        if (userId) {
            const userReposts = await db.all('SELECT postId FROM post_reposts WHERE userId = ?', [userId]);
            const repostedIds = new Set(userReposts.map(r => r.postId));
            deduplicated.forEach(p => { p.userReposted = repostedIds.has(p.id) ? 1 : 0; });
        }
        res.json(deduplicated);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a post
app.post('/api/posts', async (req, res) => {
    try {
        const { userId, content, imageData, videoData } = req.body;
        const hasMedia = imageData || videoData;
        if (!userId || (!content && !hasMedia)) {
            return res.status(400).json({ error: 'userId and content (or media) are required' });
        }
        const result = await db.run(
            'INSERT INTO posts (userId, content, imageData, videoData) VALUES (?, ?, ?, ?)',
            [userId, (content || '').trim() || '', imageData || null, videoData || null]
        );
        const post = await db.get(`
            SELECT posts.id, posts.content, posts.imageData, posts.videoData, posts.createdAt,
                   users.id AS userId, users.firstName, users.lastName, users.username, users.profilePicture
            FROM posts JOIN users ON posts.userId = users.id
            WHERE posts.id = ?
        `, [result.id]);
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a post (owner only)
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { userId } = req.query;
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (String(post.userId) !== String(userId)) return res.status(403).json({ error: 'Not authorized' });
        await db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const userId = req.query.userId;
        const comments = await db.all(`
            SELECT post_comments.id, post_comments.content, post_comments.createdAt,
                   users.id AS userId, users.firstName, users.lastName, users.username, users.profilePicture,
                   (SELECT COUNT(*) FROM comment_likes WHERE comment_likes.commentId = post_comments.id) AS likeCount,
                   (SELECT COUNT(*) FROM comment_replies WHERE comment_replies.commentId = post_comments.id) AS replyCount
            FROM post_comments
            JOIN users ON post_comments.userId = users.id
            WHERE post_comments.postId = ?
            ORDER BY post_comments.createdAt ASC
        `, [req.params.id]);
        
        // Add liked flag for current user
        if (userId) {
            for (let comment of comments) {
                const liked = await db.get('SELECT id FROM comment_likes WHERE commentId = ? AND userId = ?', [comment.id, userId]);
                comment.liked = !!liked;
            }
        }
        
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get replies for a comment
app.get('/api/comments/:id/replies', async (req, res) => {
    try {
        const userId = req.query.userId;
        const replies = await db.all(`
            SELECT comment_replies.id, comment_replies.content, comment_replies.createdAt,
                   users.id AS userId, users.firstName, users.lastName, users.username, users.profilePicture,
                   (SELECT COUNT(*) FROM reply_likes WHERE reply_likes.replyId = comment_replies.id) AS likeCount
            FROM comment_replies
            JOIN users ON comment_replies.userId = users.id
            WHERE comment_replies.commentId = ?
            ORDER BY comment_replies.createdAt ASC
        `, [req.params.id]);
        
        // Add liked flag for current user
        for (let reply of replies) {
            if (userId) {
                const liked = await db.get('SELECT id FROM reply_likes WHERE replyId = ? AND userId = ?', [reply.id, userId]);
                reply.liked = !!liked;
            } else {
                reply.liked = false;
            }
        }
        
        res.json(replies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId || !content || !content.trim()) return res.status(400).json({ error: 'userId and content required' });
        const result = await db.run(
            'INSERT INTO post_comments (postId, userId, content) VALUES (?, ?, ?)',
            [req.params.id, userId, content.trim()]
        );
        const comment = await db.get(`
            SELECT post_comments.id, post_comments.content, post_comments.createdAt,
                   post_comments.userId,
                   COALESCE(users.firstName, 'User') AS firstName,
                   COALESCE(users.lastName, '') AS lastName,
                   users.username, users.profilePicture
            FROM post_comments LEFT JOIN users ON post_comments.userId = users.id
            WHERE post_comments.id = ?
        `, [result.id]);
        res.status(201).json(comment || { id: result.id, content: content.trim(), createdAt: new Date().toISOString(), userId, firstName: 'User', lastName: '', username: '', profilePicture: null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a comment (owner only)
app.delete('/api/comments/:id', async (req, res) => {
    try {
        const { userId } = req.query;
        const comment = await db.get('SELECT * FROM post_comments WHERE id = ?', [req.params.id]);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (String(comment.userId) !== String(userId)) return res.status(403).json({ error: 'Not authorized' });
        await db.run('DELETE FROM post_comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle comment like (add if not exists, remove if exists)
app.post('/api/comments/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        const existing = await db.get('SELECT id FROM comment_likes WHERE commentId = ? AND userId = ?', [req.params.id, userId]);
        if (existing) {
            await db.run('DELETE FROM comment_likes WHERE commentId = ? AND userId = ?', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM comment_likes WHERE commentId = ?', [req.params.id]);
            res.json({ liked: false, likeCount: count.c });
        } else {
            await db.run('INSERT INTO comment_likes (commentId, userId) VALUES (?, ?)', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM comment_likes WHERE commentId = ?', [req.params.id]);
            res.json({ liked: true, likeCount: count.c });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle comment reply (add comment as reply to a comment)
app.post('/api/comments/:id/reply', async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId || !content || !content.trim()) return res.status(400).json({ error: 'userId and content required' });
        
        const result = await db.run(
            'INSERT INTO comment_replies (commentId, userId, content) VALUES (?, ?, ?)',
            [req.params.id, userId, content.trim()]
        );
        
        const count = await db.get('SELECT COUNT(*) AS c FROM comment_replies WHERE commentId = ?', [req.params.id]);
        res.json({ replyCount: count.c });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a reply (only if user is the owner)
app.delete('/api/comments/replies/:replyId', async (req, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.body?.userId;
        
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        // Verify the user owns this reply
        const reply = await db.get('SELECT * FROM comment_replies WHERE id = ?', [replyId]);
        if (!reply) return res.status(404).json({ error: 'Reply not found' });
        if (reply.userId != userId) return res.status(403).json({ error: 'Unauthorized' });
        
        // Delete the reply
        await db.run('DELETE FROM comment_replies WHERE id = ?', [replyId]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle like on a reply
app.post('/api/comments/replies/:replyId/like', async (req, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.body?.userId;
        
        if (!userId) return res.status(400).json({ error: 'userId required' });
        
        const existing = await db.get('SELECT id FROM reply_likes WHERE replyId = ? AND userId = ?', [replyId, userId]);
        
        if (existing) {
            await db.run('DELETE FROM reply_likes WHERE replyId = ? AND userId = ?', [replyId, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM reply_likes WHERE replyId = ?', [replyId]);
            res.json({ liked: false, likeCount: count.c });
        } else {
            await db.run('INSERT INTO reply_likes (replyId, userId) VALUES (?, ?)', [replyId, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM reply_likes WHERE replyId = ?', [replyId]);
            res.json({ liked: true, likeCount: count.c });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle repost (add if not exists, remove if exists)
app.post('/api/posts/:id/repost', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const existing = await db.get('SELECT id FROM post_reposts WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        if (existing) {
            await db.run('DELETE FROM post_reposts WHERE postId = ? AND userId = ?', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_reposts WHERE postId = ?', [req.params.id]);
            res.json({ reposted: false, repostCount: count.c });
        } else {
            await db.run('INSERT INTO post_reposts (postId, userId) VALUES (?, ?)', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_reposts WHERE postId = ?', [req.params.id]);
            res.json({ reposted: true, repostCount: count.c });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like/React to post
app.post('/api/posts/:id/like', async (req, res) => {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    try {
        const existing = await db.get('SELECT id FROM post_likes WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        if (existing) {
            await db.run('DELETE FROM post_likes WHERE postId = ? AND userId = ?', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_likes WHERE postId = ?', [req.params.id]);
            res.json({ liked: false, likeCount: count.c });
        } else {
            await db.run('INSERT INTO post_likes (postId, userId) VALUES (?, ?)', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_likes WHERE postId = ?', [req.params.id]);
            res.json({ liked: true, likeCount: count.c });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reply to post
app.post('/api/posts/:id/reply', async (req, res) => {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    try {
        const existing = await db.get('SELECT id FROM post_replies WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        if (existing) {
            await db.run('DELETE FROM post_replies WHERE postId = ? AND userId = ?', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_replies WHERE postId = ?', [req.params.id]);
            res.json({ replied: false, replyCount: count.c });
        } else {
            await db.run('INSERT INTO post_replies (postId, userId) VALUES (?, ?)', [req.params.id, userId]);
            const count = await db.get('SELECT COUNT(*) AS c FROM post_replies WHERE postId = ?', [req.params.id]);
            res.json({ replied: true, replyCount: count.c });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's reactions for a post
app.get('/api/posts/:id/reactions', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    try {
        const liked = await db.get('SELECT id FROM post_likes WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        const replied = await db.get('SELECT id FROM post_replies WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        const reposted = await db.get('SELECT id FROM post_reposts WHERE postId = ? AND userId = ?', [req.params.id, userId]);
        
        const likeCount = await db.get('SELECT COUNT(*) AS c FROM post_likes WHERE postId = ?', [req.params.id]);
        const replyCount = await db.get('SELECT COUNT(*) AS c FROM post_replies WHERE postId = ?', [req.params.id]);
        const repostCount = await db.get('SELECT COUNT(*) AS c FROM post_reposts WHERE postId = ?', [req.params.id]);
        
        res.json({
            liked: !!liked,
            replied: !!replied,
            reposted: !!reposted,
            likeCount: likeCount.c || 0,
            replyCount: replyCount.c || 0,
            repostCount: repostCount.c || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== GOOGLE DRIVE INTEGRATION ====================
const gdriveService = require('./db/gdrive');

// Middleware: ensure drive service is initialized and has data
app.use('/api/drive', async (req, res, next) => {
    // Check if gdriveService is properly loaded
    if (!gdriveService || typeof gdriveService.downloadFile !== 'function') {
        console.error('[Drive Middleware] gdriveService not properly initialized');
        return res.status(503).json({ 
            error: 'Drive service not ready',
            details: 'gdriveService.downloadFile is not a function'
        });
    }
    
    // Check if we have configured files
    const allFiles = gdriveService.getAllConfiguredFiles();
    if (!allFiles || Object.keys(allFiles).length === 0) {
        console.error('[Drive Middleware] No files configured in drive service');
        return res.status(503).json({ 
            error: 'Drive service not ready',
            details: 'No files configured - drive-files.json may not have been loaded'
        });
    }
    
    next();
});

// Get file by path - returns audio buffer (proxied from Google Drive)
// Usage: /api/drive/file?path=Piano/1.%20a0.wav
app.get('/api/drive/file', async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ error: 'path parameter required' });
        }
        
        // Decode the path
        const decodedPath = decodeURIComponent(path);
        console.log(`[Drive API] Fetching: ${decodedPath}`);
        
        // Get file info from config
        const fileInfo = gdriveService.findFileByPath(decodedPath);
        
        if (!fileInfo) {
            console.warn(`[Drive API] File not found in config: ${decodedPath}`);
            return res.status(404).json({ 
                error: `File not found: ${decodedPath}`,
                message: 'File ID not configured. Add it to config/drive-files.json'
            });
        }
        
        console.log(`[Drive API] Downloading file ID: ${fileInfo.id}`);
        
        // Download file from Google Drive and return as binary
        const buffer = await gdriveService.downloadFile(fileInfo.id);
        console.log(`[Drive API] Downloaded ${buffer.length} bytes for ${decodedPath}`);
        
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (error) {
        console.error('[Drive API] Error:', error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
});

// List all configured audio files
app.get('/api/drive/files', async (req, res) => {
    try {
        const files = gdriveService.getAllConfiguredFiles();
        res.json(files);
    } catch (error) {
        console.error('Error in /api/drive/files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== WEBRTC SIGNALING VIA SOCKET.IO ====================
const streamSessions = new Map(); // key: streamId, value: {streamerId, streamerSocket, viewers: Map<socketId, viewerId>}

io.on('connection', (socket) => {
    console.log(`🔌 Socket.io client connected: ${socket.id}`);
    
    // User joins a stream as viewer or gets connection info as streamer
    socket.on('join-stream', (data) => {
        const { streamId, userId, role } = data;
        // IMPORTANT: Always convert streamId to string for consistent Map lookups
        const streamIdStr = String(streamId);
        console.log(`📺 [JOIN-STREAM] User ${userId} joining stream ${streamIdStr} as ${role}`);
        
        socket.join(`stream-${streamIdStr}`);
        
        // Ensure session exists
        if (!streamSessions.has(streamIdStr)) {
            console.log(`📺 [JOIN-STREAM] Creating new session for stream ${streamIdStr}`);
            streamSessions.set(streamIdStr, {
                streamerId: null,
                streamerSocket: null,
                viewers: new Map()
            });
        }
        
        const session = streamSessions.get(streamIdStr);
        
        if (role === 'streamer') {
            session.streamerId = userId;
            session.streamerSocket = socket.id;
            console.log(`🎬 [STREAMER] Streamer ${userId} joined stream ${streamIdStr}, Socket ID: ${socket.id}`);
            console.log(`🎬 [STREAMER SESSION] Updated session:`, {streamerId: session.streamerId, streamerSocket: session.streamerSocket, viewers: session.viewers.size});
        } else if (role === 'viewer') {
            session.viewers.set(socket.id, userId);
            console.log(`📺 [VIEWER] Viewer ${userId} joined stream ${streamIdStr}. Total viewers: ${session.viewers.size}`);
            
            // Verify session state before emitting
            console.log(`🎬 [VIEWER-JOIN-DEBUG] Stream ${streamIdStr} session state:`, {
                streamerId: session.streamerId,
                streamerSocket: session.streamerSocket,
                viewerCount: session.viewers.size,
                allSessions: Array.from(streamSessions.keys())
            });
            
            // Notify streamer that a viewer joined and request offer
            const streamerSocketId = session.streamerSocket;
            if (streamerSocketId) {
                console.log(`🎬 [EMIT] Emitting viewer-joined to streamer socket ${streamerSocketId}`);
                io.to(streamerSocketId).emit('viewer-joined', { 
                    viewerId: userId, 
                    viewerSocketId: socket.id,
                    streamId: streamIdStr
                });
            } else {
                console.warn(`⚠️ [EMIT] No streamer socket found for stream ${streamIdStr}. Session:`, session);
            }
        }
    });
    
    // Streamer sends their SDP offer to specific viewer
    socket.on('send-offer', (data) => {
        const { streamId, offer, viewerSocketId } = data;
        console.log(`🎬 [SEND-OFFER] Streamer sending offer for stream ${streamId} to viewer ${viewerSocketId}`);
        io.to(viewerSocketId).emit('receive-offer', { offer, offererId: socket.id, streamId: streamId });
    });
    
    // Viewer sends their SDP answer back to streamer
    socket.on('send-answer', (data) => {
        const { streamId, answer, offererId } = data;
        console.log(`📺 [SEND-ANSWER] Viewer ${socket.id} sending answer for stream ${streamId} to streamer ${offererId}`);
        io.to(offererId).emit('receive-answer', { answer, streamId: streamId, viewerSocketId: socket.id });
    });
    
    // Exchange ICE candidates
    socket.on('ice-candidate', (data) => {
        const { streamId, candidate, toSocket } = data;
        if (toSocket) {
            io.to(toSocket).emit('ice-candidate', { candidate, streamId: streamId });
        } else {
            socket.to(`stream-${streamId}`).emit('ice-candidate', { candidate, streamId: streamId });
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`🔌 Socket.io client disconnected: ${socket.id}`);
        
        // Remove from all active streams
        streamSessions.forEach((session, streamId) => {
            if (session.streamerSocket === socket.id) {
                session.streamerSocket = null;
                session.streamerId = null;
                console.log(`🎬 [DISCONNECT] Streamer disconnected from stream ${streamId}`);
            }
            if (session.viewers.has(socket.id)) {
                const viewerId = session.viewers.get(socket.id);
                session.viewers.delete(socket.id);
                console.log(`📺 [DISCONNECT] Viewer ${viewerId} disconnected from stream ${streamId}`);
            }
        });
    });
    
    socket.on('leave-stream', (data) => {
        const { streamId } = data;
        const streamIdStr = String(streamId);
        socket.leave(`stream-${streamIdStr}`);
        if (streamSessions.has(streamIdStr)) {
            const session = streamSessions.get(streamIdStr);
            session.viewers.delete(socket.id);
            console.log(`📺 [LEAVE-STREAM] Viewer left stream ${streamIdStr}. Remaining viewers: ${session.viewers.size}`);
        }
    });

    // ==================== JAMMING SESSION EVENTS ====================
    // VIEWER: Request to join jamming session
    socket.on('jamming-join-request', (data) => {
        const { streamId, userId, username, socketId } = data;
        const streamIdStr = String(streamId);
        console.log(`🎸 [JAMMING-JOIN-REQUEST] Viewer ${username} (${userId}) requesting to join jamming for stream ${streamIdStr}`);
        
        if (streamSessions.has(streamIdStr)) {
            const session = streamSessions.get(streamIdStr);
            const streamerSocketId = session.streamerSocket;
            
            if (streamerSocketId) {
                console.log(`🎸 [JAMMING-FORWARD] Forwarding join request to streamer socket ${streamerSocketId}`);
                io.to(streamerSocketId).emit('jamming-join-request', {
                    userId: userId,
                    username: username,
                    socketId: socketId,
                    streamId: streamIdStr
                });
            } else {
                console.warn(`⚠️ [JAMMING] No streamer socket found for stream ${streamIdStr}`);
            }
        } else {
            console.warn(`⚠️ [JAMMING] Stream session not found for ${streamIdStr}`);
        }
    });

    // STREAMER: Accept jamming request
    socket.on('jamming-join-accepted', (data) => {
        const { viewerSocketId, streamerId, streamerUsername } = data;
        console.log(`🎸 [JAMMING-ACCEPT] Streamer accepting viewer on socket ${viewerSocketId}`);
        
        io.to(viewerSocketId).emit('jamming-join-accepted', {
            streamerId: streamerId,
            streamerUsername: streamerUsername
        });
    });

    // STREAMER: Deny jamming request
    socket.on('jamming-join-denied', (data) => {
        const { viewerSocketId, reason } = data;
        console.log(`🎸 [JAMMING-DENY] Streamer denying viewer on socket ${viewerSocketId}`);
        
        io.to(viewerSocketId).emit('jamming-join-denied', {
            reason: reason || 'Request denied'
        });
    });

    // PARTICIPANT: Leave jamming session - notify all others
    socket.on('leave-jamming', (data) => {
        const { streamId, userId } = data;
        const streamIdStr = String(streamId);
        console.log(`🎸 [JAMMING-LEAVE] User ${userId} left jamming on stream ${streamIdStr}`);
        
        if (streamSessions.has(streamIdStr)) {
            const streamSession = streamSessions.get(streamIdStr);
            const streamerSocket = streamSession.streamerSocket;
            
            // Notify streamer that someone left
            if (streamerSocket) {
                io.to(streamerSocket).emit('jamming-participant-left', {
                    userId: userId,
                    streamId: streamId
                });
            }
            
            // Notify all other participants
            const viewers = streamSession.viewers;
            if (viewers) {
                viewers.forEach(viewerInfo => {
                    if (viewerInfo.socketId !== socket.id) {
                        io.to(viewerInfo.socketId).emit('jamming-participant-left', {
                            userId: userId,
                            streamId: streamId
                        });
                    }
                });
            }
        }
    });

    // BROADCAST: New participant joined (from streamer to all participants)
    socket.on('broadcast-jamming-participant-joined', (data) => {
        const { streamId, userId, username, socketId } = data;
        const streamIdStr = String(streamId);
        console.log(`🎸 [JAMMING-BROADCAST] New participant ${username} joined stream ${streamIdStr}`);
        
        if (streamSessions.has(streamIdStr)) {
            const streamSession = streamSessions.get(streamIdStr);
            const viewers = streamSession.viewers;
            
            // Broadcast to all other viewers (except the one joining and streamer)
            if (viewers) {
                viewers.forEach(viewerInfo => {
                    if (viewerInfo.socketId !== socketId) {
                        io.to(viewerInfo.socketId).emit('jamming-participant-joined', {
                            userId: userId,
                            username: username,
                            socketId: socketId
                        });
                    }
                });
            }
        }
    });
});

// ==================== CATCH-ALL ROUTES ====================
// Serve HTML files for any remaining requests
app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Page not found' });
        }
    });
});

// Catch-all for any other requests - serve index or return 404
app.use((req, res) => {
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, 'Pages', 'index.html'), (err) => {
            if (err) {
                res.status(404).json({ error: 'Not found' });
            }
        });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
server.listen(PORT, async () => {
    try {
        await initializeApp();
        console.log(`\n🎵 Jammazing server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints ready`);
        console.log(`💾 Using In-Memory Database (data stored in RAM)`);
        console.log(`⚠️  Data will be lost when server restarts\n`);
        console.log(`🔌 WebSocket signaling server ready on port ${PORT}\n`);
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server...');
    if (db) await db.close();
    process.exit(0);
});

module.exports = app;
