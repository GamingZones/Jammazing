const fs = require('fs');
const path = require('path');

// On Vercel, use /tmp for writable storage; otherwise use config directory
const QUIZZES_FILE = process.env.VERCEL 
    ? path.join('/tmp', 'quizzes.json')
    : path.join(__dirname, '../config/quizzes.json');

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
                console.log(`✅ Loaded ${this.quizzes.size} quizzes from ${QUIZZES_FILE}`);
            } else {
                console.log(`⚠️  No quizzes file found at ${QUIZZES_FILE}, starting with empty quiz database`);
                // On Vercel, load from config/quizzes.json as bootstrap
                if (process.env.VERCEL) {
                    const configPath = path.join(__dirname, '../config/quizzes.json');
                    if (fs.existsSync(configPath)) {
                        const data = fs.readFileSync(configPath, 'utf8');
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(q => {
                                this.quizzes.set(q.id || q._id, q);
                            });
                        }
                        console.log(`✅ Bootstrapped ${this.quizzes.size} quizzes from config/quizzes.json`);
                        this.saveQuizzes();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
        }
    }

    saveQuizzes() {
        try {
            const data = Array.from(this.quizzes.values());
            // Ensure directory exists on Vercel
            const dir = path.dirname(QUIZZES_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(QUIZZES_FILE, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Saved ${data.length} quizzes to ${QUIZZES_FILE}`);
        } catch (error) {
            console.error(`❌ Error saving quizzes to ${QUIZZES_FILE}:`, error);
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
        console.log(`✅ Creating quiz with ID ${id}:`, {
            title: quiz.title,
            description: quiz.description,
            creatorId: quiz.creatorId,
            quizType: quiz.quizType,
            difficultyLevel: quiz.difficultyLevel,
            totalQuestions: quiz.totalQuestions
        });
        this.quizzes.set(id, quiz);
        this.saveQuizzes();
        console.log(`✅ Created quiz ${id} and saved`);
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
            console.log(`✅ Deleted quiz ${id}`);
        }
        return deleted;
    }

    getQuizzesByCreator(creatorId) {
        return Array.from(this.quizzes.values()).filter(q => String(q.creatorId) === String(creatorId));
    }
}

module.exports = new QuizzesService();
