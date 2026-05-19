-- Jammazing Database Schema for SQLite

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    accountType TEXT NOT NULL CHECK(accountType IN ('student', 'instructor')),
    profilePicture TEXT,
    bio TEXT,
    instrument TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table (Extended profile information)
CREATE TABLE IF NOT EXISTS userProfiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    location TEXT,
    skillLevel TEXT CHECK(skillLevel IN ('beginner', 'intermediate', 'advanced')),
    favoriteGenres TEXT,
    musicTheoryKnowledge INTEGER DEFAULT 0,
    totalPracticeHours INTEGER DEFAULT 0,
    bio TEXT,
    socialLinks TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    creatorId INTEGER NOT NULL,
    quizType TEXT CHECK(quizType IN ('general', 'instruments')),
    difficultyLevel TEXT CHECK(difficultyLevel IN ('easy', 'medium', 'hard')),
    timeLimit INTEGER,
    totalQuestions INTEGER DEFAULT 0,
    passingScore REAL DEFAULT 70.0,
    isPublished INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS quizQuestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId INTEGER NOT NULL,
    questionText TEXT NOT NULL,
    questionType TEXT CHECK(questionType IN ('multiple_choice', 'true_false', 'short_answer')),
    orderIndex INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Quiz Question Options (for multiple choice)
CREATE TABLE IF NOT EXISTS quizQuestionOptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionId INTEGER NOT NULL,
    optionText TEXT NOT NULL,
    isCorrect INTEGER DEFAULT 0,
    orderIndex INTEGER,
    FOREIGN KEY (questionId) REFERENCES quizQuestions(id) ON DELETE CASCADE
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quizAttempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    score REAL,
    passed INTEGER DEFAULT 0,
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME,
    timeSpent INTEGER,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- Live Streams Table
CREATE TABLE IF NOT EXISTS liveStreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamerId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    thumbnail TEXT,
    streamUrl TEXT,
    isLive INTEGER DEFAULT 0,
    viewerCount INTEGER DEFAULT 0,
    scheduledStartTime DATETIME,
    actualStartTime DATETIME,
    endTime DATETIME,
    recordingData LONGBLOB,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (streamerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Live Stream Viewers
CREATE TABLE IF NOT EXISTS streamViewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamId INTEGER NOT NULL,
    viewerId INTEGER NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    leftAt DATETIME,
    FOREIGN KEY (streamId) REFERENCES liveStreams(id) ON DELETE CASCADE,
    FOREIGN KEY (viewerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER NOT NULL,
    recipientId INTEGER,
    conversationId INTEGER,
    messageText TEXT NOT NULL,
    attachmentUrl TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant1Id INTEGER NOT NULL,
    participant2Id INTEGER NOT NULL,
    lastMessageAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1Id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2Id) REFERENCES users(id) ON DELETE CASCADE
);

-- Backing Tracks Table
CREATE TABLE IF NOT EXISTS backingTracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    genre TEXT,
    description TEXT,
    fileUrl TEXT NOT NULL,
    duration INTEGER,
    bpm INTEGER,
    keySignature TEXT,
    uploaderId INTEGER NOT NULL,
    isFeatured INTEGER DEFAULT 0,
    playCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaderId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notificationType TEXT CHECK(notificationType IN ('message', 'stream', 'quiz', 'follower', 'comment')),
    relatedId INTEGER,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Follower Relationships
CREATE TABLE IF NOT EXISTS followers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    followerId INTEGER NOT NULL,
    followingId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(followerId, followingId),
    FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    content TEXT NOT NULL,
    imageData TEXT,
    videoData TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Post Reposts Table
CREATE TABLE IF NOT EXISTS post_reposts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postId, userId),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postId, userId),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Post Replies Table (for tracking reply interactions)
CREATE TABLE IF NOT EXISTS post_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(postId, userId),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Ratings/Reviews Table
CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    quizId INTEGER,
    streamId INTEGER,
    trackId INTEGER,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    reviewText TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (streamId) REFERENCES liveStreams(id) ON DELETE CASCADE,
    FOREIGN KEY (trackId) REFERENCES backingTracks(id) ON DELETE CASCADE
);

-- Learning Progress Table
CREATE TABLE IF NOT EXISTS learningProgress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    topicName TEXT NOT NULL,
    progressPercentage REAL DEFAULT 0,
    lessonsCompleted INTEGER DEFAULT 0,
    totalLessons INTEGER,
    lastAccessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- Stream Chat Messages Table
CREATE TABLE IF NOT EXISTS streamChat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamId INTEGER NOT NULL,
    senderId INTEGER NOT NULL,
    senderName TEXT NOT NULL,
    message TEXT NOT NULL,
    videoOffset REAL DEFAULT 0.0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (streamId) REFERENCES liveStreams(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_quizzes_creatorId ON quizzes(creatorId);
CREATE INDEX IF NOT EXISTS idx_liveStreams_streamerId ON liveStreams(streamerId);
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_recipientId ON messages(recipientId);
CREATE INDEX IF NOT EXISTS idx_messages_conversationId ON messages(conversationId);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_followers_followerId ON followers(followerId);
CREATE INDEX IF NOT EXISTS idx_followers_followingId ON followers(followingId);
CREATE INDEX IF NOT EXISTS idx_quizAttempts_studentId ON quizAttempts(studentId);
CREATE INDEX IF NOT EXISTS idx_quizAttempts_quizId ON quizAttempts(quizId);
