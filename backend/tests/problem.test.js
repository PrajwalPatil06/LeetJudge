import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/database.js';
import { hashPassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { getAllTags } from '../models/tag.js';

describe('Problem Endpoints', () => {
    let adminToken = '';
    let problemId = '';
    const adminUser = {
        name: 'Admin Test',
        username: 'admintest_' + Date.now(),
        email: 'admintest_' + Date.now() + '@example.com',
        password: 'password123'
    };

    beforeAll(async () => {
        const hash = await hashPassword(adminUser.password);
        const res = await pool.query(
            'INSERT INTO accounts (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, role',
            [adminUser.name, adminUser.username, adminUser.email, hash, 'ADMIN']
        );
        adminUser.id = res.rows[0].id;
        adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });
    });

    afterAll(async () => {
        if (problemId) {
            await pool.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]).catch(() => {});
            await pool.query('DELETE FROM problems WHERE id = $1', [problemId]).catch(() => {});
        }
        await pool.query('DELETE FROM accounts WHERE id = $1', [adminUser.id]).catch(() => {});
    });

    it('should create a new problem as ADMIN', async () => {
        const res = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Two Sum Test',
                description: 'Given an array of integers and a target...',
                tags: ['Array', 'Tree'],
                difficulty: 'EASY',
                timelimit: 1000,
                memorylimit: 262144
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.problem).toHaveProperty('id');
        problemId = res.body.problem.id;
    });

    it('should reject invalid tags', async () => {
        const res = await request(app)
            .post('/api/problems')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Invalid Tags Test',
                description: 'Test problem',
                tags: ['Invalid Tag 123'],
                difficulty: 'EASY',
                timelimit: 1000,
                memorylimit: 262144
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/Invalid tag/);
    });

    it('should get a list of problems', async () => {
        const res = await request(app).get('/api/problems');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.problems)).toBeTruthy();
    });

    it('should return allowed problem tags', async () => {
        const res = await request(app).get('/api/problems/tags');
        expect(res.statusCode).toEqual(200);
        expect(res.body.tags).toEqual(getAllTags());
    });

    it('should add test cases to the created problem', async () => {
        const res = await request(app)
            .post(`/api/problems/${problemId}/testcases`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                testCases: [
                    { input: "2 7 11 15\n9", output: "0 1" },
                    { input: "3 2 4\n6", output: "1 2" }
                ]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.testCases.length).toEqual(2);
    });

    it('should fetch the problem by id with test cases', async () => {
        const res = await request(app).get(`/api/problems/${problemId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.problem.id).toEqual(problemId);
        expect(res.body.problem.testCases.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent problem', async () => {
        const res = await request(app).get('/api/problems/00000000-0000-0000-0000-000000000000');
        expect(res.statusCode).toEqual(404);
    });
});
