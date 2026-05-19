// Quiz Model for In-Memory Database
class Quiz {
    constructor(memDb) {
        this.db = memDb;
    }

    async create(quizData) {
        return await this.db.createQuiz(quizData);
    }

    async getById(id) {
        return null;
    }

    async getAll() {
        return [];
    }

    async getByCreator(creatorId) {
        return [];
    }

    async getActiveLiveStreams() {
        return [];
    }

    async getByDifficulty(difficulty) {
        return [];
    }

    async getByType(type) {
        return [];
    }

    async update(id, updates) {
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
        return true;
    }
}

module.exports = Quiz;

