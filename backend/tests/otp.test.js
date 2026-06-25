import request from 'supertest';
import app from '../app.js';
import { pool } from '../config/database.js';

describe('OTP Endpoints', () => {
    const testEmail = 'otp_test_user@example.com';
    let otpValue = '';

    afterAll(async () => {
        // Cleanup OTPs for the test email
        await pool.query('DELETE FROM otps WHERE email = $1', [testEmail]).catch(() => {});
    });

    it('should send an OTP to the given email', async () => {
        const res = await request(app)
            .post('/api/otp/send')
            .send({ email: testEmail });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('OTP sent successfully');

        // Fetch the generated OTP from the database to test the verify endpoint
        const dbRes = await pool.query('SELECT otp FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [testEmail]);
        expect(dbRes.rows.length).toEqual(1);
        otpValue = dbRes.rows[0].otp;
    });

    it('should fail to verify with an incorrect OTP', async () => {
        const res = await request(app)
            .post('/api/otp/verify')
            .send({ email: testEmail, otp: '000000' }); // Assuming 000000 is incorrect (1/1000000 chance it is correct)

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid or expired OTP');
    });

    it('should successfully verify with the correct OTP', async () => {
        const res = await request(app)
            .post('/api/otp/verify')
            .send({ email: testEmail, otp: otpValue });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('OTP verified successfully');
    });

    it('should fail to send OTP if email is invalid', async () => {
        const res = await request(app)
            .post('/api/otp/send')
            .send({ email: 'not-an-email' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid email format');
    });
});
