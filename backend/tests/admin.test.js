import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/database.js';

describe('Admin Analytics API', () => {
    let adminToken, userToken;
    const testAdmin = {
        name: 'Admin User',
        username: 'adminuser_' + Date.now(),
        email: 'adminuser_' + Date.now() + '@example.com',
        password: 'password123'
    };
    const testUser = {
        name: 'Regular User',
        username: 'regularuser_' + Date.now(),
        email: 'regularuser_' + Date.now() + '@example.com',
        password: 'password123'
    };

    beforeAll(async () => {
        // Create Admin User
        await request(app).post('/api/auth/signup').send(testAdmin);
        // Promote to ADMIN directly via DB
        await pool.query("UPDATE accounts SET role = 'ADMIN' WHERE email = $1", [testAdmin.email]);
        // Login Admin
        const adminRes = await request(app).post('/api/auth/login').send({ email: testAdmin.email, password: testAdmin.password });
        adminToken = adminRes.body.token;

        // Create Regular User
        await request(app).post('/api/auth/signup').send(testUser);
        // Login Regular User
        const userRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
        userToken = userRes.body.token;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM accounts WHERE email IN ($1, $2)', [testAdmin.email, testUser.email]).catch(() => {});
    });

    it('should deny access without a token', async () => {
        const res = await request(app).get('/api/admin/analytics');
        expect(res.statusCode).toEqual(401);
    });

    it('should deny access to standard users', async () => {
        const res = await request(app)
            .get('/api/admin/analytics')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403);
    });

    it('should allow access to admins and return analytics data', async () => {
        const res = await request(app)
            .get('/api/admin/analytics')
            .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('totalUsers');
        expect(res.body).toHaveProperty('totalProblems');
        expect(res.body).toHaveProperty('totalSubmissions');
        expect(res.body).toHaveProperty('totalContests');
        expect(res.body).toHaveProperty('submissionsByVerdict');
        expect(res.body).toHaveProperty('problemsByDifficulty');
        expect(res.body).toHaveProperty('recentSubmissions');
        
        expect(Array.isArray(res.body.submissionsByVerdict)).toBe(true);
        expect(Array.isArray(res.body.problemsByDifficulty)).toBe(true);
        expect(Array.isArray(res.body.recentSubmissions)).toBe(true);
    });
});
