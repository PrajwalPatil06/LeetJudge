import { pool } from '../config/database.js';

export const getDashboardAnalytics = async () => {
    // We can run these queries concurrently using Promise.all
    const [
        usersResult,
        problemsResult,
        contestsResult,
        submissionsResult,
        submissionsByVerdictResult,
        problemsByDifficultyResult,
        recentSubmissionsResult,
        submissionsByLanguageResult,
        recentContestsResult,
        contestFormatsResult
    ] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM accounts'),
        pool.query('SELECT COUNT(*) FROM problems'),
        pool.query('SELECT COUNT(*) FROM contests'),
        pool.query('SELECT COUNT(*) FROM submissions'),
        pool.query('SELECT verdict, COUNT(*) FROM submissions GROUP BY verdict'),
        pool.query('SELECT difficulty, COUNT(*) FROM problems GROUP BY difficulty'),
        pool.query(`
            SELECT DATE(timestamp) as date, COUNT(*) as count 
            FROM submissions 
            WHERE timestamp >= NOW() - INTERVAL '7 days' 
            GROUP BY DATE(timestamp) 
            ORDER BY DATE(timestamp) ASC
        `),
        pool.query('SELECT lang, COUNT(*) as count FROM submissions GROUP BY lang'),
        pool.query(`
            SELECT c.id, c.name, c.start_time, c.end_time, COUNT(cp.user_id) as participant_count
            FROM contests c
            LEFT JOIN contest_participants cp ON c.id = cp.contest_id
            GROUP BY c.id
            ORDER BY c.start_time DESC
            LIMIT 5
        `),
        pool.query('SELECT format, COUNT(*) as count FROM contests GROUP BY format')
    ]);

    return {
        totalUsers: parseInt(usersResult.rows[0].count, 10),
        totalProblems: parseInt(problemsResult.rows[0].count, 10),
        totalContests: parseInt(contestsResult.rows[0].count, 10),
        totalSubmissions: parseInt(submissionsResult.rows[0].count, 10),
        submissionsByVerdict: submissionsByVerdictResult.rows.map(r => ({
            verdict: r.verdict,
            count: parseInt(r.count, 10)
        })),
        problemsByDifficulty: problemsByDifficultyResult.rows.map(r => ({
            difficulty: r.difficulty,
            count: parseInt(r.count, 10)
        })),
        recentSubmissions: recentSubmissionsResult.rows.map(r => ({
            date: new Date(r.date).toISOString().split('T')[0],
            count: parseInt(r.count, 10)
        })),
        submissionsByLanguage: submissionsByLanguageResult.rows.map(r => ({
            lang: parseInt(r.lang, 10),
            count: parseInt(r.count, 10)
        })),
        recentContests: recentContestsResult.rows.map(r => ({
            id: r.id,
            name: r.name,
            startTime: r.start_time,
            endTime: r.end_time,
            participants: parseInt(r.participant_count, 10)
        })),
        contestFormats: contestFormatsResult.rows.map(r => ({
            format: r.format,
            count: parseInt(r.count, 10)
        }))
    };
};
