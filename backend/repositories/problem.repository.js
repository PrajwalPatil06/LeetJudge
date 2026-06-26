// Repository pattern - all data access for the problems table lives here
import { query } from '../config/database.js';

export const create = async ({
    title,
    description,
    tags,
    difficulty,
    createdBy,
    timelimit,
    memorylimit,
    editorial,
    isEditorialVisible = true,
    isHidden = false
}) => {
    const result = await query(
        `
        INSERT INTO problems
        (
            title,
            description,
            tags,
            difficulty,
            created_by,
            timelimit,
            memorylimit,
            editorial,
            is_editorial_visible,
            is_hidden
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
            title,
            description,
            tags,
            difficulty,
            createdBy,
            timelimit,
            memorylimit,
            editorial,
            isEditorialVisible,
            isHidden
        ]
    );

    return result.rows[0];
};

export const findById = async (problemId) => {
    const result = await query(
        `
        SELECT 
            p.*,
            (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id) as total_submissions,
            (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id AND s.verdict = 'ACCEPTED') as accepted_submissions
        FROM problems p
        WHERE p.id = $1
        `,
        [problemId]
    );

    return result.rows[0];
};

export const findAll = async (limit, offset, userId = null, userRole = 'USER') => {
    // If user is Admin, they can see everything.
    // If user is problem setter, they can see their own hidden problems.
    // Otherwise, normal users can only see hidden problems if they are in an active or past contest.
    
    let visibilityCondition = `
        p.is_hidden = false 
        OR p.id IN (
            SELECT cp.problem_id 
            FROM contest_problems cp 
            JOIN contests c ON cp.contest_id = c.id 
            WHERE c.start_time <= NOW()
        )
    `;

    if (userRole === 'ADMIN') {
        visibilityCondition = `TRUE`;
    } else if (userId) {
        visibilityCondition = `(${visibilityCondition}) OR p.created_by = $3`;
    }

    const queryArgs = [limit, offset];
    if (userRole !== 'ADMIN' && userId) {
        queryArgs.push(userId);
    }

    const result = await query(
        `
        SELECT
            p.id,
            p.title,
            p.difficulty,
            p.tags,
            p.timelimit,
            p.memorylimit,
            p.is_editorial_visible,
            (p.is_hidden AND NOT EXISTS (
                SELECT 1 FROM contest_problems cp 
                JOIN contests c ON cp.contest_id = c.id 
                WHERE cp.problem_id = p.id AND c.start_time <= NOW()
            )) as is_hidden,
            p.created_at,
            (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id) as total_submissions,
            (SELECT COUNT(*) FROM submissions s WHERE s.problem_id = p.id AND s.verdict = 'ACCEPTED') as accepted_submissions
        FROM problems p
        WHERE ${visibilityCondition}
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
        `,
        queryArgs
    );

    return result.rows;
};

export const update = async (problemId, { title, description, tags, difficulty, timelimit, memorylimit, editorial, isEditorialVisible, isHidden }) => {
    const result = await query(
        `
        UPDATE problems
        SET title = $1, description = $2, tags = $3, difficulty = $4, timelimit = $5, memorylimit = $6, editorial = $7, is_editorial_visible = $8, is_hidden = $9
        WHERE id = $10
        RETURNING *
        `,
        [title, description, tags, difficulty, timelimit, memorylimit, editorial, isEditorialVisible, isHidden, problemId]
    );
    return result.rows[0];
};

export const deleteProblem = async (problemId) => {
    const result = await query(
        `
        DELETE FROM problems
        WHERE id = $1
        RETURNING id
        `,
        [problemId]
    );
    return result.rows[0];
};

export const addEditor = async (problemId, userId) => {
    const result = await query(
        `
        INSERT INTO problem_editors (problem_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (problem_id, user_id) DO NOTHING
        RETURNING *
        `,
        [problemId, userId]
    );
    return result.rows[0];
};

export const getEditors = async (problemId) => {
    const result = await query(
        `
        SELECT user_id FROM problem_editors
        WHERE problem_id = $1
        `,
        [problemId]
    );
    return result.rows.map(row => row.user_id);
};