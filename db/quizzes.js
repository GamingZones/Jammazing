const fs = require('fs');
const path = require('path');

const QUIZZES_FILE = path.join(__dirname, '../config/quizzes.json');

class QuizzesService {
    constructor() {
        this.quizzes = new Map();
        this.loadQuizzes();
    }

    loadQuizzes() {
        try {
            if (fs.existsSync(QUIZZES_FILE)) {
                const data = fs.readFileSync(QUIZZES_FILE, 'utf8');
                const parsed = JSON.parse(data);
                
                // Convert array to Map
                if (Array.isArray(parsed)) {
                    parsed.forEach(q => {
                        this.quizzes.set(q.id || q._id, q);
                    });
                }
                console.log(`✅ Loaded ${this.quizzes.size} quizzes from file`);
            } else {
                console.log('⚠️  No quizzes file found, starting with empty quiz database');
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
        }
    }

    saveQuizzes() {
        try {
            const data = Array.from(this.quizzes.values());
            fs.writeFileSync(QUIZZES_FILE, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Saved ${data.length} quizzes to file`);
        } catch (error) {
            console.error('Error saving quizzes:', error);
        }
    }

    getAllQuizzes() {
        return Array.from(this.quizzes.values());
    }

    getQuiz(id) {
        return this.quizzes.get(id) || null;
    }

    createQuiz(quizData) {
        const id = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const quiz = {
            id,
            _id: id,
            ...quizData,
            createdAt: new Date().toISOString()
        };
        this.quizzes.set(id, quiz);
        this.saveQuizzes();
        return id;
    }

    updateQuiz(id, updates) {
        const quiz = this.quizzes.get(id);
        if (!quiz) return false;
        
        Object.assign(quiz, updates);
        this.saveQuizzes();
        return true;
    }

    deleteQuiz(id) {
        const deleted = this.quizzes.delete(id);
        if (deleted) {
            this.saveQuizzes();
        }
        return deleted;
    }

    getQuizzesByCreator(creatorId) {
        return Array.from(this.quizzes.values()).filter(q => String(q.creatorId) === String(creatorId));
    }
}

module.exports = new QuizzesService();
