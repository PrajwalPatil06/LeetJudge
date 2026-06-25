// Repository pattern - all data access for the accounts table lives here
import { query } from '../config/database.js';

export const create = async ({
    name,
    username,
    email,
    passwordHash = null,
    googleId = null,
    role
}) => {
    const result = await query(
        `
        INSERT INTO accounts
        (name, username, email, password_hash, google_id, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [name, username, email, passwordHash, googleId, role]
    );

    return result.rows[0];
};

export const findByGoogleId = async (googleId) => {
    const result = await query(
        `
        SELECT *
        FROM accounts
        WHERE google_id = $1
        `,
        [googleId]
    );

    return result.rows[0];
};

export const linkGoogleId = async (id, googleId) => {
    const result = await query(
        `
        UPDATE accounts
        SET google_id = $2
        WHERE id = $1
        RETURNING *
        `,
        [id, googleId]
    );

    return result.rows[0];
};

export const findById = async (id) => {
    const result = await query(
        `
        SELECT *
        FROM accounts
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
};

export const findByEmail = async (email) => {
    const result = await query(
        `
        SELECT *
        FROM accounts
        WHERE email = $1
        `,
        [email]
    );

    return result.rows[0];
};

export const findByUsername = async (username) => {
    const result = await query(
        `
        SELECT *
        FROM accounts
        WHERE username = $1
        `,
        [username]
    );

    return result.rows[0];
};