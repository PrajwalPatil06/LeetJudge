import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { fileURLToPath } from 'url';
import { pool, query } from './config/database.js';
import  redisConnection  from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
// Basic Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'LeetJudge API is running' });
});

// Bootstrap application
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
