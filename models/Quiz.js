// Quiz Model for MongoDB
class Quiz {
    constructor(mongoDb) {
        this.db = mongoDb;
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
        return await this.db.addQuestionToQuiz(quizId, question);
    }

    async recordAttempt(quizId, userId, attempt) {
        return await this.db.recordAttempt(quizId, userId, attempt);
    }

    async delete(id) {
        return true;
    }
}

module.exports = Quiz;

    // Publish quiz
    async publish(id) {
        return await this.db.db.ref(`quizzes/${id}`).update({ 
            isPublished: true,
            updatedAt: new Date().toISOString()
        });
    }

    // Delete quiz
    async delete(id) {
        return await this.db.db.ref(`quizzes/${id}`).remove();
    }

    // Add question to quiz
    async addQuestion(quizId, questionText, questionType) {
        return await this.db.addQuestionToQuiz(quizId, {
            questionText,
            questionType
        });
    }

    // Get questions for a quiz
    async getQuestions(quizId) {
        try {
            const quiz = await this.db.getQuizById(quizId);
            if (!quiz || !quiz.questions) return [];
            
            return Object.values(quiz.questions);
        } catch (error) {
            console.error('Error getting questions:', error);
            return [];
        }
    }

    // Add answer option
    async addQuestionOption(questionId, optionText, isCorrect) {
        try {
            const snapshot = await this.db.db.ref('quizzes').once('value');
            let quizId = null;
            
            snapshot.forEach((child) => {
                const quiz = child.val();
                for (const qId of Object.keys(quiz.questions || {})) {
                    if (qId === questionId) {
                        quizId = quiz.id;
                    }
                }
            });

            if (quizId) {
                return await this.db.addOptionToQuestion(quizId, questionId, {
                    optionText,
                    isCorrect
                });
            }
            return null;
        } catch (error) {
            console.error('Error adding question option:', error);
            throw error;
        }
    }

    // Get options for a question
    async getQuestionOptions(questionId) {
        try {
            const snapshot = await this.db.db.ref('quizzes').once('value');
            let options = [];
            
            snapshot.forEach((child) => {
                const quiz = child.val();
                for (const qId of Object.keys(quiz.questions || {})) {
                    if (qId === questionId) {
                        options = Object.values(quiz.questions[qId].options || {});
                    }
                }
            });

            return options;
        } catch (error) {
            console.error('Error getting question options:', error);
            return [];
        }
    }

    // Record quiz attempt
    async recordAttempt(quizId, studentId, score, passed, timeSpent) {
        return await this.db.createQuizAttempt({
            quizId,
            studentId,
            score,
            passed,
            timeSpent,
            passingScore: 70
        });
    }

    // Get student quiz attempts
    async getStudentAttempts(quizId, studentId) {
        try {
            const snapshot = await this.db.db.ref('quizAttempts').once('value');
            const attempts = [];
            
            snapshot.forEach((child) => {
                const attempt = child.val();
                if (attempt.quizId === quizId && attempt.studentId === studentId) {
                    attempts.push(attempt);
                }
            });

            return attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        } catch (error) {
            console.error('Error getting student attempts:', error);
            return [];
        }
    }

    // Get quiz statistics
    async getQuizStats(quizId) {
        try {
            const snapshot = await this.db.db.ref('quizAttempts').once('value');
            let totalAttempts = 0;
            let passCount = 0;
            let totalScore = 0;

            snapshot.forEach((child) => {
                const attempt = child.val();
                if (attempt.quizId === quizId) {
                    totalAttempts++;
                    totalScore += attempt.score;
                    if (attempt.passed) passCount++;
                }
            });

            return {
                totalAttempts,
                averageScore: totalAttempts > 0 ? totalScore / totalAttempts : 0,
                passCount
            };
        } catch (error) {
            console.error('Error getting quiz stats:', error);
            return { totalAttempts: 0, averageScore: 0, passCount: 0 };
        }
    }
}

module.exports = Quiz;
