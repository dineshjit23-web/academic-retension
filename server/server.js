import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDB } from './db.js';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'academic-retention-secret-key-2026';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3005;
const distPath = path.join(__dirname, '../dist');

app.use(cors());
app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Initializations
let db;
let ai;

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// Middleware for Role-Based Access Control
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// Initialize Database and AI
async function startServer() {
    try {
        db = await initDB();
        console.log('Database initialized successfully');

        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
            console.log('AI service initialized');
        }

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Serving static files from: ${distPath}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// User Routes
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role = 'student', intensity = 'normal' } = req.body;
    try {
        const existingUser = await db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) return res.status(400).json({ error: 'Username or Email already exists' });

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            'INSERT INTO users (id, username, email, password, role, intensity) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, hashedPassword, role, intensity]
        );

        res.status(201).json({ message: 'User registered successfully', userId: id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                intensity: user.intensity
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.get('SELECT id, username, email, role, intensity FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = uuidv4();
        const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

        await db.run('UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?', [token, expiry, user.id]);

        // In a real app, send an email here. For this demo, we'll return the token.
        res.json({ message: 'Reset token generated (Check console in real app)', token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await db.get('SELECT id, reset_expiry FROM users WHERE reset_token = ?', [token]);
        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const now = new Date();
        if (new Date(user.reset_expiry) < now) {
            return res.status(400).json({ error: 'Token expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PIN Routes
app.post('/api/auth/pin/register', authenticateToken, async (req, res) => {
    const { username, pin } = req.body;
    try {
        // In a real app, hash the PIN. For this demo, we'll store it in biometric_metadata.
        await db.run('UPDATE users SET biometric_metadata = ? WHERE username = ?', [JSON.stringify({ pin }), username]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/pin/verify', authenticateToken, async (req, res) => {
    const { username, pin } = req.body;
    try {
        const user = await db.get('SELECT biometric_metadata FROM users WHERE username = ?', [username]);
        if (!user || !user.biometric_metadata) {
            return res.status(404).json({ error: "No PIN profile found" });
        }
        const saved = JSON.parse(user.biometric_metadata);
        if (saved.pin === pin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: "Incorrect PIN" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Official Concept Routes (Faculty/Admin)
app.get('/api/official-concepts', authenticateToken, async (req, res) => {
    try {
        const concepts = await db.all('SELECT * FROM concepts WHERE is_official = 1');
        res.json(concepts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/official-concepts', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    const { id, title, subject, description, difficulty, questions } = req.body;
    try {
        await db.run(`
      INSERT INTO concepts (id, user_id, title, subject, description, difficulty, is_official, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'Official')
    `, [id, req.user.id, title, subject, description, difficulty, req.user.id]);

        if (questions && Array.isArray(questions)) {
            for (let q of questions) {
                await db.run(`
          INSERT INTO quiz_questions (id, concept_id, question, options, correct_answer_index, explanation)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), id, q.question, JSON.stringify(q.options), q.correctAnswerIndex, q.explanation]);
            }
        }
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/official-concepts/:id', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    const { title, subject, description, difficulty } = req.body;
    try {
        await db.run(`
      UPDATE concepts 
      SET title = ?, subject = ?, description = ?, difficulty = ?
      WHERE id = ? AND is_official = 1
    `, [title, subject, description, difficulty, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/official-concepts/:id', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        await db.run('DELETE FROM quiz_questions WHERE concept_id = ?', [req.params.id]);
        await db.run('DELETE FROM concepts WHERE id = ? AND is_official = 1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Concept Performance Analytics
app.get('/api/analytics/concepts/performance', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        const performances = await db.all(`
            SELECT c.title, AVG(c.retention_score) as avg_retention
            FROM concepts c
            WHERE c.is_official = 0
            GROUP BY c.title
        `);
        res.json(performances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/concepts/:userId', authenticateToken, async (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role === 'student') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    try {
        const concepts = await db.all('SELECT * FROM concepts WHERE user_id = ?', [req.params.userId]);
        const now = new Date();

        for (let concept of concepts) {
            concept.reviews = await db.all('SELECT * FROM reviews WHERE concept_id = ?', [concept.id]);

            // Calculate Decay
            if (concept.last_reviewed && concept.last_reviewed !== '-') {
                const lastDate = new Date(concept.last_reviewed);
                const daysElapsed = (now - lastDate) / (1000 * 60 * 60 * 24);

                let k = 0.04; // Default Medium
                if (concept.difficulty === 'Easy') k = 0.02;
                if (concept.difficulty === 'Hard') k = 0.06;

                const decayedScore = Math.round(concept.retention_score * Math.exp(-k * daysElapsed));
                concept.retention_score = Math.max(0, decayedScore);
            }

            // Determine Mastery Level
            if (concept.retention_score < 40) concept.mastery = 'Beginner';
            else if (concept.retention_score < 80) concept.mastery = 'Intermediate';
            else concept.mastery = 'Advanced';
        }
        res.json(concepts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/adaptive/study-plan', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const concepts = await db.all('SELECT * FROM concepts WHERE user_id = ? AND is_official = 0', [userId]);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const urgentRevision = [];
        const recommendedPractice = [];

        for (let concept of concepts) {
            // Apply decay first to get current score
            if (concept.last_reviewed && concept.last_reviewed !== '-') {
                const lastDate = new Date(concept.last_reviewed);
                const daysElapsed = (now - lastDate) / (1000 * 60 * 60 * 24);
                let k = 0.04;
                if (concept.difficulty === 'Easy') k = 0.02;
                if (concept.difficulty === 'Hard') k = 0.06;
                const decayedScore = Math.round(concept.retention_score * Math.exp(-k * daysElapsed));
                concept.retention_score = Math.max(0, decayedScore);
            }

            const isDue = concept.next_review_date <= todayStr;
            const isLowScore = concept.retention_score < 60;

            if (isDue || isLowScore) {
                urgentRevision.push({
                    id: concept.id,
                    title: concept.title,
                    subject: concept.subject,
                    retentionScore: concept.retention_score,
                    reason: isDue ? 'Review Overdue' : 'Low Mastery'
                });
            } else if (concept.retention_score >= 60 && concept.retention_score < 85) {
                const lastDate = concept.last_reviewed && concept.last_reviewed !== '-' ? new Date(concept.last_reviewed) : null;
                const daysSinceLastReview = lastDate ? (now - lastDate) / (1000 * 60 * 60 * 24) : 999;

                if (daysSinceLastReview > 3) {
                    recommendedPractice.push({
                        id: concept.id,
                        title: concept.title,
                        subject: concept.subject,
                        retentionScore: concept.retention_score
                    });
                }
            }
        }

        res.json({
            urgentRevision: urgentRevision.sort((a, b) => a.retentionScore - b.retentionScore),
            recommendedPractice: recommendedPractice.sort((a, b) => b.retentionScore - a.retentionScore).slice(0, 3),
            summary: urgentRevision.length > 0
                ? `Focus on ${urgentRevision.length} concepts that need urgent attention.`
                : "You're all caught up! Consider a practice test to maintain mastery."
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/concepts', authenticateToken, async (req, res) => {
    const { id, user_id, title, subject, description, difficulty, retentionScore, lastReviewed, nextReviewDate, status, questions } = req.body;
    try {
        await db.run(`
      INSERT INTO concepts (id, user_id, title, subject, description, difficulty, retention_score, last_reviewed, next_review_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, user_id, title, subject, description, difficulty, retentionScore, lastReviewed, nextReviewDate, status]);

        if (questions && Array.isArray(questions)) {
            for (let q of questions) {
                await db.run(`
          INSERT INTO quiz_questions (id, concept_id, question, options, correct_answer_index, explanation)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [Date.now() + Math.random().toString(), id, q.question, JSON.stringify(q.options), q.correctAnswerIndex, q.explanation]);
            }
        }
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/concepts/:id', authenticateToken, async (req, res) => {
    const { retentionScore, lastReviewed, nextReviewDate, status } = req.body;
    try {
        await db.run(`
      UPDATE concepts 
      SET retention_score = ?, last_reviewed = ?, next_review_date = ?, status = ?
      WHERE id = ?
    `, [retentionScore, lastReviewed, nextReviewDate, status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/concepts/:id', authenticateToken, async (req, res) => {
    try {
        await db.run('DELETE FROM reviews WHERE concept_id = ?', [req.params.id]);
        await db.run('DELETE FROM quiz_questions WHERE concept_id = ?', [req.params.id]);
        await db.run('DELETE FROM concepts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { id, concept_id, date, score, timeSpent } = req.body;
    try {
        await db.run(`
      INSERT INTO reviews (id, concept_id, date, score, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `, [id, concept_id, date, score, timeSpent]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Attendance Routes
app.get('/api/attendance/:userId', authenticateToken, async (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role === 'student') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    try {
        const attendance = await db.all('SELECT * FROM attendance WHERE user_id = ?', [req.params.userId]);
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance', authenticateToken, async (req, res) => {
    const { id, user_id, date, status, semester } = req.body;
    try {
        await db.run(`
      INSERT OR REPLACE INTO attendance (id, user_id, date, status, semester)
      VALUES (?, ?, ?, ?, ?)
    `, [id, user_id, date, status, semester]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assignment Routes
app.get('/api/assignments/:userId', authenticateToken, async (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role === 'student') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    try {
        const assignments = await db.all('SELECT * FROM assignments WHERE user_id = ?', [req.params.userId]);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/assignments', authenticateToken, async (req, res) => {
    const { id, user_id, title, subject, due_date, status, marks, semester } = req.body;
    try {
        await db.run(`
      INSERT INTO assignments (id, user_id, title, subject, due_date, status, marks, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, user_id, title, subject, due_date, status, marks, semester]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/assignments/:id', authenticateToken, async (req, res) => {
    const { status, marks } = req.body;
    try {
        await db.run(`
      UPDATE assignments SET status = ?, marks = ? WHERE id = ?
    `, [status, marks, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const users = await db.all('SELECT id, username, email, role, intensity FROM users');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id/role', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { role } = req.body;
    try {
        await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/faculty/students', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        const students = await db.all('SELECT id, username, email FROM users WHERE role = "student"');
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Predictive Analysis: At-Risk Students
app.get('/api/analytics/at-risk', authenticateToken, authorizeRole(['faculty', 'admin']), async (req, res) => {
    try {
        const students = await db.all('SELECT id, username, email FROM users WHERE role = "student"');
        const atRisk = [];
        const now = new Date();

        for (let student of students) {
            const concepts = await db.all('SELECT retention_score, last_reviewed, difficulty FROM concepts WHERE user_id = ?', [student.id]);
            let totalDecayedRetention = 0;
            let weakConcepts = 0;

            if (concepts.length > 0) {
                concepts.forEach(c => {
                    let k = 0.04;
                    if (c.difficulty === 'Easy') k = 0.02;
                    if (c.difficulty === 'Hard') k = 0.06;

                    let currentScore = c.retention_score;
                    if (c.last_reviewed && c.last_reviewed !== '-') {
                        const days = (now - new Date(c.last_reviewed)) / (1000 * 60 * 60 * 24);
                        currentScore = Math.round(c.retention_score * Math.exp(-k * days));
                    }

                    totalDecayedRetention += currentScore;
                    if (currentScore < 50) weakConcepts++;
                });

                const avgRetention = totalDecayedRetention / concepts.length;
                if (avgRetention < 60 || weakConcepts > 2) {
                    atRisk.push({
                        ...student,
                        avgRetention: Math.round(avgRetention),
                        weakConcepts,
                        riskLevel: avgRetention < 40 ? 'High' : 'Medium'
                    });
                }
            }
        }
        res.json(atRisk);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Performance Summary
app.get('/api/performance/summary/:userId', authenticateToken, async (req, res) => {
    if (req.user.id !== req.params.userId && req.user.role === 'student') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    try {
        const attendanceCount = await db.get('SELECT COUNT(*) as count FROM attendance WHERE user_id = ? AND status = "Present"', [req.params.userId]);
        const totalDays = await db.get('SELECT COUNT(*) as count FROM attendance WHERE user_id = ?', [req.params.userId]);
        const assignmentAvg = await db.get('SELECT AVG(marks) as avg FROM assignments WHERE user_id = ? AND marks IS NOT NULL', [req.params.userId]);
        const semesterData = await db.all(`
            SELECT semester, AVG(marks) as avg_marks 
            FROM assignments 
            WHERE user_id = ? AND marks IS NOT NULL 
            GROUP BY semester
        `, [req.params.userId]);

        res.json({
            attendanceRate: totalDays.count > 0 ? (attendanceCount.count / totalDays.count) * 100 : 0,
            assignmentAverage: assignmentAvg.avg || 0,
            semesterComparison: semesterData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Routes
app.post('/api/ai/quiz', authenticateToken, async (req, res) => {
    const { concept } = req.body;

    try {
        // First check for manual questions
        const manualQuestions = await db.all('SELECT * FROM quiz_questions WHERE concept_id = ?', [concept.id]);
        if (manualQuestions && manualQuestions.length > 0) {
            return res.json(manualQuestions.map(q => ({
                question: q.question,
                options: JSON.parse(q.options),
                correctAnswerIndex: q.correct_answer_index,
                explanation: q.explanation
            })));
        }

        const requestApiKey = req.headers['x-gemini-api-key'];
        let localAi = ai;

        if (requestApiKey) {
            console.log('[AI] Using request-specific API key for quiz');
            localAi = new GoogleGenAI({ apiKey: requestApiKey });
        }

        if (!localAi) return res.status(533).json({ error: "AI service not configured. Please set an API key in Settings." });

        const model = localAi.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Generate exactly 10 high-quality, conceptually challenging, and HARD one-mark review questions (Multiple Choice) to test the deep understanding and application of the following academic concept:
      Title: ${concept.title}
      Subject: ${concept.subject}
      Description: ${concept.description}
      
      Requirements:
      1. Difficulty Level: Hard. Avoid basic definitions. Focus on analysis, application, and conceptual edge cases.
      2. Quantity: Exactly 10 questions.
      3. Style: Each question should be a "Hard Review Question".
      4. Format: Return JSON only following the schema.`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswerIndex: { type: Type.INTEGER },
                            explanation: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctAnswerIndex", "explanation"]
                    }
                }
            }
        });

        res.json(JSON.parse(result.response.text()));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
    const { concepts } = req.body;
    const requestApiKey = req.headers['x-gemini-api-key'];
    let localAi = ai;

    if (requestApiKey) {
        console.log('[AI] Using request-specific API key for analysis');
        localAi = new GoogleGenAI({ apiKey: requestApiKey });
    }

    if (!localAi) return res.status(533).json({ error: "AI service not configured. Please set an API key in Settings." });

    try {
        const model = localAi.getGenerativeModel({ model: "gemini-1.5-flash" });
        const summary = concepts.map(c => `${c.title} (${c.retention_score}%)`).join(", ");
        const prompt = `Analyze the following academic concept retention scores and provide a brief (2-sentence) coaching insight for the student: ${summary}`;

        const result = await model.generateContent(prompt);
        res.json({ insight: result.response.text() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/flashcard', authenticateToken, async (req, res) => {
    const { concept } = req.body;
    const requestApiKey = req.headers['x-gemini-api-key'];
    let localAi = ai;

    if (requestApiKey) {
        localAi = new GoogleGenAI({ apiKey: requestApiKey });
    }

    if (!localAi) return res.status(533).json({ error: "AI service not configured" });

    try {
        const model = localAi.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Create a single high-quality flashcard question and answer based on this concept:
      Title: ${concept.title}
      Description: ${concept.description}
      Return JSON with fields "question" and "answer".`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING }
                    },
                    required: ["question", "answer"]
                }
            }
        });
        res.json(JSON.parse(result.response.text()));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files from the React app
app.use(express.static(distPath));

// Explicit route for root
app.get('/', (req, res) => {
    console.log('Explicit root request received');
    res.sendFile(path.join(distPath, 'index.html'));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        console.log('API 404:', req.url);
        return res.status(404).json({ error: "API route not found" });
    }
    console.log('Catch-all fallback triggered for:', req.url);
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send(err.message);
        }
    });
});

// Error handling for the process
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

await startServer();
