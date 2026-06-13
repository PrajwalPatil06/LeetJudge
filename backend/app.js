import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
import { pool, query } from './config/database.js';
import  redisConnection  from './config/redis.js';
// Middleware
app.use(express.json());

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
