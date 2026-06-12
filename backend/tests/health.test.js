import request from 'supertest';
import app from '../app.js';

describe('Health Check API', () => {
    it('should return 200 and health status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'ok',
            message: 'LeetJudge API is running'
        });
    });
});
