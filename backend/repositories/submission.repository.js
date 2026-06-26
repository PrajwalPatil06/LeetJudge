// Repository pattern - all data access for the submissions table lives here
import { query } from '../config/database.js';

export const create = async ({
    userId,
    problemId,
    contestId,
    code,
    language
}) => {
    const result = await query(
        `
        INSERT INTO submissions
        (
            user_id,
            problem_id,
            contest_id,
            code,
            lang
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
            userId,
            problemId,
            contestId || null,
            code,
            language
        ]
    );

    return result.rows[0];
};

export const findById = async (submissionId) => {
    const result = await query(
        `
        SELECT s.*, p.title as problem_title
        FROM submissions s
        LEFT JOIN problems p ON s.problem_id = p.id
        WHERE s.id = $1
        `,
        [submissionId]
    );

    return result.rows[0];
};

export const findByUserId = async (userId) => {
    const result = await query(
        `
        SELECT s.*, p.title as problem_title
        FROM submissions s
        LEFT JOIN problems p ON s.problem_id = p.id
        WHERE s.user_id = $1
        ORDER BY s.timestamp DESC
        `,
        [userId]
    );

    return result.rows;
};

export const findByUserAndProblem = async (
    userId,
    problemId
) => {
    const result = await query(
        `
        SELECT *
        FROM submissions
        WHERE user_id = $1
        AND problem_id = $2
        ORDER BY timestamp DESC
        `,
        [userId, problemId]
    );

    return result.rows;
};

export const updateVerdict = async (
    submissionId,
    {
        verdict,
        verdictMessage,
        executionTimeMs,
        memoryUsedKb,
        errorTestCase,
        expectedOutput,
        actualOutput
    }
) => {
    const result = await query(
        `
        UPDATE submissions
        SET
            verdict = $1,
            verdict_message = $2,
            execution_time_ms = $3,
            memory_used_kb = $4,
            error_test_case = $5,
            expected_output = $6,
            actual_output = $7
        WHERE id = $8
        RETURNING *
        `,
        [
            verdict,
            verdictMessage,
            executionTimeMs,
            memoryUsedKb,
            errorTestCase,
            expectedOutput,
            actualOutput,
            submissionId
        ]
    );

    return result.rows[0];
};

export const updateAiAnalysis = async (submissionId, aiAnalysis) => {
    const result = await query(
        `
        UPDATE submissions
        SET ai_analysis = $1
        WHERE id = $2
        RETURNING *
        `,
        [aiAnalysis, submissionId]
    );
    return result.rows[0];
};