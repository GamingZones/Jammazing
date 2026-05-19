// Quiz Model
class Quiz {
    constructor(db) {
        this.db = db;
    }

    // Create a new quiz
    async create(quizData) {
        const { title, description, creatorId, quizType, difficultyLevel, timeLimit, passingScore } = quizData;
        
        const sql = `
            INSERT INTO quizzes (title, description, creatorId, quizType, difficultyLevel, timeLimit, passingScore)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        return await this.db.run(sql, [
            title,
            description,
            creatorId,
            quizType,
            difficultyLevel,
            timeLimit,
            passingScore
        ]);
    }

    // Get quiz by ID
    async getById(id) {
        const sql = `SELECT q.*, u.username as creatorName 
                     FROM quizzes q 
                     LEFT JOIN users u ON q.creatorId = u.id 
                     WHERE q.id = ?`;
        return await this.db.get(sql, [id]);
    }

    // Get all quizzes
    async getAll() {
        const sql = `SELECT q.*, u.username as creatorName 
                     FROM quizzes q 
                     LEFT JOIN users u ON q.creatorId = u.id 
                     WHERE q.isPublished = 1 
                     ORDER BY q.createdAt DESC`;
        return await this.db.all(sql);
    }

    // Get quizzes by creator
    async getByCreator(creatorId) {
        const sql = `SELECT q.*, u.username as creatorName 
                     FROM quizzes q 
                     LEFT JOIN users u ON q.creatorId = u.id 
                     WHERE q.creatorId = ? 
                     ORDER BY q.createdAt DESC`;
        return await this.db.all(sql, [creatorId]);
    }

    // Get quizzes by difficulty
    async getByDifficulty(difficulty) {
        const sql = `SELECT q.*, u.username as creatorName 
                     FROM quizzes q 
                     LEFT JOIN users u ON q.creatorId = u.id 
                     WHERE q.difficultyLevel = ? AND q.isPublished = 1 
                     ORDER BY q.createdAt DESC`;
        return await this.db.all(sql, [difficulty]);
    }

    // Get quizzes by type
    async getByType(type) {
        const sql = `SELECT q.*, u.username as creatorName 
                     FROM quizzes q 
                     LEFT JOIN users u ON q.creatorId = u.id 
                     WHERE q.quizType = ? AND q.isPublished = 1 
                     ORDER BY q.createdAt DESC`;
        return await this.db.all(sql, [type]);
    }

    // Update quiz
    async update(id, quizData) {
        const { title, description, quizType, difficultyLevel, timeLimit, passingScore } = quizData;
        
        const sql = `
            UPDATE quizzes 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                quizType = COALESCE(?, quizType),
                difficultyLevel = COALESCE(?, difficultyLevel),
                timeLimit = COALESCE(?, timeLimit),
                passingScore = COALESCE(?, passingScore),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        return await this.db.run(sql, [
            title,
            description,
            quizType,
            difficultyLevel,
            timeLimit,
            passingScore,
            id
        ]);
    }

    // Publish quiz
    async publish(id) {
        const sql = 'UPDATE quizzes SET isPublished = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Delete quiz
    async delete(id) {
        const sql = 'DELETE FROM quizzes WHERE id = ?';
        return await this.db.run(sql, [id]);
    }

    // Add question to quiz
    async addQuestion(quizId, questionText, questionType) {
        const sql = `
            INSERT INTO quizQuestions (quizId, questionText, questionType)
            VALUES (?, ?, ?)
        `;
        
        const result = await this.db.run(sql, [quizId, questionText, questionType]);
        
        // Update total questions count
        await this.db.run(
            'UPDATE quizzes SET totalQuestions = totalQuestions + 1 WHERE id = ?',
            [quizId]
        );

        return result;
    }

    // Get questions for a quiz
    async getQuestions(quizId) {
        const sql = 'SELECT * FROM quizQuestions WHERE quizId = ? ORDER BY orderIndex ASC';
        return await this.db.all(sql, [quizId]);
    }

    // Add answer option
    async addQuestionOption(questionId, optionText, isCorrect) {
        const sql = `
            INSERT INTO quizQuestionOptions (questionId, optionText, isCorrect)
            VALUES (?, ?, ?)
        `;

        return await this.db.run(sql, [questionId, optionText, isCorrect ? 1 : 0]);
    }

    // Get options for a question
    async getQuestionOptions(questionId) {
        const sql = 'SELECT * FROM quizQuestionOptions WHERE questionId = ? ORDER BY orderIndex ASC';
        return await this.db.all(sql, [questionId]);
    }

    // Record quiz attempt
    async recordAttempt(quizId, studentId, score, passed, timeSpent) {
        const sql = `
            INSERT INTO quizAttempts (quizId, studentId, score, passed, timeSpent, completedAt)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        return await this.db.run(sql, [quizId, studentId, score, passed ? 1 : 0, timeSpent]);
    }

    // Get student quiz attempts
    async getStudentAttempts(quizId, studentId) {
        const sql = `
            SELECT * FROM quizAttempts 
            WHERE quizId = ? AND studentId = ?
            ORDER BY completedAt DESC
        `;
        return await this.db.all(sql, [quizId, studentId]);
    }

    // Get quiz statistics
    async getQuizStats(quizId) {
        const sql = `
            SELECT 
                COUNT(*) as totalAttempts,
                AVG(CAST(score AS FLOAT)) as averageScore,
                SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passCount
            FROM quizAttempts
            WHERE quizId = ?
        `;
        return await this.db.get(sql, [quizId]);
    }
}

module.exports = Quiz;
