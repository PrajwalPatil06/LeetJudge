import { query, pool } from '../config/database.js';

export const create = async ({ name, description, format, start_time, end_time, created_by, is_public }) => {
    const result = await query(
        `INSERT INTO contests (name, description, format, start_time, end_time, created_by, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, description, format, start_time, end_time, created_by, is_public]
    );
    return result.rows[0];
};

export const findAll = async (offset, limit) => {
    const result = await query(`SELECT * FROM contests ORDER BY start_time DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return result.rows;
};

export const findById = async (contestId) => {
    const result = await query(`SELECT * FROM contests WHERE id = $1`, [contestId]);
    return result.rows[0];
};

export const updateContest = async (contestId, updates) => {
    const { name, description, is_public, format, start_time, end_time } = updates;
    const result = await query(
        `UPDATE contests 
         SET name = COALESCE($1, name), description = COALESCE($2, description), 
             is_public = COALESCE($3, is_public), format = COALESCE($4, format), 
             start_time = COALESCE($5, start_time), end_time = COALESCE($6, end_time)
         WHERE id = $7 RETURNING *`,
        [name, description, is_public, format, start_time, end_time, contestId]
    );
    return result.rows[0];
};

export const deleteContest = async (contestId) => {
    const result = await query(`DELETE FROM contests WHERE id = $1 RETURNING id`, [contestId]);
    return result.rows[0];
};

export const addParticipant = async (contestId, userId) => {
    const result = await query(
        `INSERT INTO contest_participants (contest_id, user_id) 
         VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
        [contestId, userId]
    );
    return result.rows[0];
};

export const getParticipant = async (contestId, userId) => {
    const result = await query(
        `SELECT * FROM contest_participants WHERE contest_id = $1 AND user_id = $2`,
        [contestId, userId]
    );
    return result.rows[0];
};

export const getParticipants = async (contestId) => {
    const result = await query(
        `SELECT cp.*, a.username FROM contest_participants cp
         JOIN accounts a ON cp.user_id = a.id WHERE cp.contest_id = $1`,
        [contestId]
    );
    return result.rows;
};

export const getProblems = async (contestId) => {
    const result = await query(
        `SELECT cp.problem_id, cp.problem_order, cp.max_score, p.id, p.title, p.difficulty 
         FROM contest_problems cp
         JOIN problems p ON cp.problem_id = p.id
         WHERE cp.contest_id = $1 ORDER BY cp.problem_order ASC`,
        [contestId]
    );
    return result.rows;
};

export const updateProblems = async (contestId, problems) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Clear existing problems for this contest
        await client.query(`DELETE FROM contest_problems WHERE contest_id = $1`, [contestId]);
        
        // Insert new problems
        for (const prob of problems) {
            await client.query(
                `INSERT INTO contest_problems (contest_id, problem_id, problem_order, max_score) 
                 VALUES ($1, $2, $3, $4)`,
                [contestId, prob.problem_id, prob.problem_order, prob.max_score]
            );
        }
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getSubmissions = async (contestId, userId) => {
    const result = await query(
        `SELECT s.id, s.problem_id, s.lang, s.verdict, s.execution_time_ms, s.timestamp,
                p.title as problem_title
         FROM submissions s
         JOIN problems p ON s.problem_id = p.id
         WHERE s.contest_id = $1 AND s.user_id = $2 ORDER BY s.timestamp DESC`,
        [contestId, userId]
    );
    return result.rows;
};

export const getLeaderboard = async (contestId) => {
    // Basic standard format leaderboard: Sum of max scores for accepted submissions per user
    const result = await query(
        `WITH RankedSubmissions AS (
            SELECT s.user_id, s.problem_id, cp.max_score,
                   ROW_NUMBER() OVER(PARTITION BY s.user_id, s.problem_id ORDER BY s.timestamp DESC) as rn
            FROM submissions s
            JOIN contest_problems cp ON s.problem_id = cp.problem_id AND s.contest_id = cp.contest_id
            WHERE s.contest_id = $1 AND s.verdict = 'ACCEPTED'
        )
        SELECT rs.user_id, a.username, SUM(rs.max_score) as total_score
        FROM RankedSubmissions rs
        JOIN accounts a ON rs.user_id = a.id
        WHERE rs.rn = 1
        GROUP BY rs.user_id, a.username
        ORDER BY total_score DESC`,
        [contestId]
    );
    return result.rows;
};