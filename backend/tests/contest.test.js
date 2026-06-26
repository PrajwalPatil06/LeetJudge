import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/database.js';
import { hashPassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';

describe('Contest Endpoints', () => {
    // Test users: admin can create contests, regular user cannot
    const adminUser = {
        name: 'Contest Admin',
        username: 'contest_admin_' + Date.now(),
        email: 'contest_admin_' + Date.now() + '@example.com',
        password: 'password123'
    };

    const regularUser = {
        name: 'Contest User',
        username: 'contest_user_' + Date.now(),
        email: 'contest_user_' + Date.now() + '@example.com',
        password: 'password123'
    };

    let adminToken = '';
    let userToken = '';
    let contestId = '';
    let activeContestId = ''; // A contest that is currently active, for registration tests
    let problemId = '';

    // Far-future dates for a contest that hasn't started
    const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // +1 year
    const futureEnd = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000).toISOString(); // +1 year 1 day

    // Active contest window (started 1 year ago, ends in 1 year)
    const activeStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const activeEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    beforeAll(async () => {
        const adminHash = await hashPassword(adminUser.password);
        const adminRes = await pool.query(
            'INSERT INTO accounts (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [adminUser.name, adminUser.username, adminUser.email, adminHash, 'ADMIN']
        );
        adminUser.id = adminRes.rows[0].id;
        adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

        const userHash = await hashPassword(regularUser.password);
        const userRes = await pool.query(
            'INSERT INTO accounts (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [regularUser.name, regularUser.username, regularUser.email, userHash, 'USER']
        );
        regularUser.id = userRes.rows[0].id;
        userToken = generateToken({ id: regularUser.id, role: 'USER' });

        // Create a problem to use in contest-problems tests
        const probRes = await pool.query(
            `INSERT INTO problems (title, description, difficulty, created_by, timelimit, memorylimit)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            ['Contest Test Problem', 'A test problem for contests', 'EASY', adminUser.id, 1000, 262144]
        );
        problemId = probRes.rows[0].id;
    });

    afterAll(async () => {
        // Clean up in dependency order
        for (const cId of [contestId, activeContestId]) {
            if (cId) {
                await pool.query('DELETE FROM contest_participants WHERE contest_id = $1', [cId]).catch(() => {});
                await pool.query('DELETE FROM contest_problems WHERE contest_id = $1', [cId]).catch(() => {});
                await pool.query('DELETE FROM contests WHERE id = $1', [cId]).catch(() => {});
            }
        }
        if (problemId) {
            await pool.query('DELETE FROM problems WHERE id = $1', [problemId]).catch(() => {});
        }
        await pool.query('DELETE FROM accounts WHERE id = $1', [adminUser.id]).catch(() => {});
        await pool.query('DELETE FROM accounts WHERE id = $1', [regularUser.id]).catch(() => {});
    });

    // --- Contest CRUD ---

    it('should create a contest as ADMIN', async () => {
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Integration Test Contest',
                description: 'A contest created by tests',
                format: 'STANDARD',
                is_public: true,
                start_time: futureStart,
                end_time: futureEnd
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toEqual('Integration Test Contest');
        expect(res.body.format).toEqual('STANDARD');
        contestId = res.body.id;
    });

    it('should reject contest creation without authentication', async () => {
        const res = await request(app)
            .post('/api/contests')
            .send({
                name: 'Unauthorized Contest',
                format: 'STANDARD',
                start_time: futureStart,
                end_time: futureEnd
            });

        expect(res.statusCode).toEqual(401);
    });

    it('should reject contest creation by USER role', async () => {
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'User Contest',
                format: 'STANDARD',
                start_time: futureStart,
                end_time: futureEnd
            });

        expect(res.statusCode).toEqual(403);
    });

    it('should reject contest with end_time before start_time', async () => {
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Bad Times Contest',
                format: 'STANDARD',
                start_time: futureEnd,   // later
                end_time: futureStart    // earlier
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/end time/i);
    });

    it('should reject contest with invalid format', async () => {
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Bad Format Contest',
                format: 'INVALID_FORMAT',
                start_time: futureStart,
                end_time: futureEnd
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/format/i);
    });

    it('should reject contest with empty name', async () => {
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: '',
                format: 'STANDARD',
                start_time: futureStart,
                end_time: futureEnd
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/name/i);
    });

    // --- Listing & Fetching ---

    it('should get all contests', async () => {
        const res = await request(app).get('/api/contests');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.some(c => c.id === contestId)).toBeTruthy();
    });

    it('should get contest by ID', async () => {
        const res = await request(app).get(`/api/contests/${contestId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(contestId);
        expect(res.body.name).toEqual('Integration Test Contest');
    });

    it('should return 404 for non-existent contest', async () => {
        const res = await request(app).get('/api/contests/00000000-0000-0000-0000-000000000000');

        expect(res.statusCode).toEqual(404);
    });

    // --- Update ---

    it('should update a contest as ADMIN', async () => {
        const res = await request(app)
            .patch(`/api/contests/${contestId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Updated Contest Name' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated Contest Name');
    });

    it('should reject update by USER role', async () => {
        const res = await request(app)
            .patch(`/api/contests/${contestId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ name: 'Hacked Name' });

        expect(res.statusCode).toEqual(403);
    });

    // --- Registration (uses future and active contests) ---

    it('should create an active contest for registration tests', async () => {
        // We still need an active contest to test submissions later
        const res = await request(app)
            .post('/api/contests')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Active Registration Contest',
                format: 'STANDARD',
                is_public: true,
                start_time: activeStart,
                end_time: activeEnd
            });

        expect(res.statusCode).toEqual(201);
        activeContestId = res.body.id;

        // Force register the user directly in the DB so submissions can be tested later
        await pool.query('INSERT INTO contest_participants (contest_id, user_id) VALUES ($1, $2)', [activeContestId, regularUser.id]);
    });

    it('should register a user for a future contest', async () => {
        const res = await request(app)
            .post(`/api/contests/${contestId}/register`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('contest_id', contestId);
    });

    it('should reject registration for an active contest', async () => {
        // Create another user to attempt registration
        const hash = await hashPassword('password123');
        const resUser = await pool.query(
            'INSERT INTO accounts (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            ['Late User', 'late_user_' + Date.now(), 'late_' + Date.now() + '@example.com', hash, 'USER']
        );
        const lateUserToken = generateToken({ id: resUser.rows[0].id, role: 'USER' });

        const res = await request(app)
            .post(`/api/contests/${activeContestId}/register`)
            .set('Authorization', `Bearer ${lateUserToken}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/already started/i);

        await pool.query('DELETE FROM accounts WHERE id = $1', [resUser.rows[0].id]);
    });

    it('should reject duplicate registration', async () => {
        const res = await request(app)
            .post(`/api/contests/${contestId}/register`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/already registered/i);
    });

    it('should return registration status for a future contest', async () => {
        const res = await request(app)
            .get(`/api/contests/${contestId}/registration-status`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.isRegistered).toBe(true);
    });

    // --- Contest Problems ---

    it('should add problems to the contest', async () => {
        const res = await request(app)
            .put(`/api/contests/${contestId}/problems`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                problems: [
                    { problem_id: problemId, problem_order: 1, max_score: 100 }
                ]
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/updated successfully/i);
    });

    it('should reject editing problems by USER role', async () => {
        const res = await request(app)
            .put(`/api/contests/${contestId}/problems`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                problems: [
                    { problem_id: problemId, problem_order: 1, max_score: 100 }
                ]
            });

        expect(res.statusCode).toEqual(403);
    });

    it('should get contest problems (ADMIN can see before start)', async () => {
        const res = await request(app)
            .get(`/api/contests/${contestId}/problems`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toEqual(1);
        // Verify both id and problem_id are present
        expect(res.body[0]).toHaveProperty('id', problemId);
        expect(res.body[0]).toHaveProperty('problem_id', problemId);
        expect(res.body[0]).toHaveProperty('title', 'Contest Test Problem');
    });

    // --- Leaderboard ---

    it('should get an empty leaderboard', async () => {
        const res = await request(app).get(`/api/contests/${contestId}/leaderboard`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toEqual(0);
    });

    // --- Submissions ---

    it('should get contest submissions for a registered user', async () => {
        const res = await request(app)
            .get(`/api/contests/${activeContestId}/submissions`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    // --- Delete ---

    it('should reject delete by USER role', async () => {
        const res = await request(app)
            .delete(`/api/contests/${contestId}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toEqual(403);
    });

    it('should delete the contest as ADMIN', async () => {
        const res = await request(app)
            .delete(`/api/contests/${contestId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 after deleting the contest', async () => {
        const res = await request(app).get(`/api/contests/${contestId}`);

        expect(res.statusCode).toEqual(404);
        // Clear contestId so afterAll cleanup doesn't try to delete again
        contestId = '';
    });
});
