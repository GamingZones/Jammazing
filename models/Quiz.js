// Quiz Model for In-Memory Database
class Quiz {
    constructor(memDb) {
        this.db = memDb;
    }

    async create(quizData) {
        return await this.db.createQuiz(quizData);
    }

    async getById(id) {
        return this.db.quizzes.get(id) || null;
    }

    async getAll() {
        return Array.from(this.db.quizzes.values());
    }

    async getByCreator(creatorId) {
        return Array.from(this.db.quizzes.values()).filter(q => String(q.creatorId) === String(creatorId));
    }

    async getActiveLiveStreams() {
        return Array.from(this.db.liveStreams.values());
    }

    async getByDifficulty(difficulty) {
        return Array.from(this.db.quizzes.values()).filter(q => q.difficultyLevel === difficulty);
    }

    async getByType(type) {
        return Array.from(this.db.quizzes.values()).filter(q => q.quizType === type);
    }

    async update(id, updates) {
        const quiz = this.db.quizzes.get(id);
        if (!quiz) return false;
        Object.assign(quiz, updates);
        return true;
    }

    async addQuestion(quizId, question) {
        if (!this.db) return false;
        return await this.db.addQuestionToQuiz(quizId, question);
    }

    async recordAttempt(quizId, userId, attempt) {
        if (!this.db) return false;
        return await this.db.recordAttempt(quizId, userId, attempt);
    }

    async delete(id) {
        return this.db.quizzes.delete(id);
    }
}

module.exports = Quiz;

