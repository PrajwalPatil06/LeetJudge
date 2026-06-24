import ResendEmailProvider from './email/ResendEmailProvider.js';

// Instantiate the configured provider (Adapter Pattern)
// If you switch to SendGrid later, change this to: new SendGridEmailProvider()
const emailProvider = new ResendEmailProvider();

export const sendOtpEmail = async (email, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verification Code</h2>
            <p>Your OTP for LeetJudge is:</p>
            <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
        </div>
    `;
    return emailProvider.sendEmail({ to: email, subject: 'Your LeetJudge Verification Code', html });
};

export const sendWelcomeEmail = async (email, name) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to LeetJudge, ${name}! 🚀</h2>
            <p>We're thrilled to have you join our platform. Start solving problems and leveling up your coding skills today.</p>
            <p>Happy Coding!</p>
        </div>
    `;
    return emailProvider.sendEmail({ to: email, subject: 'Welcome to LeetJudge!', html });
};

export const sendLoginAlertEmail = async (email, ip, location, device, time) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Login Detected</h2>
            <p>A new login to your LeetJudge account was just detected.</p>
            <ul>
                <li><strong>Device:</strong> ${device}</li>
                ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
                <li><strong>IP Address:</strong> ${ip}</li>
                <li><strong>Time:</strong> ${time}</li>
            </ul>
            <p>If this was you, you can safely ignore this email. If not, please change your password immediately.</p>
        </div>
    `;
    return emailProvider.sendEmail({ to: email, subject: 'Security Alert: New Login', html });
};

export const sendPremiumEmail = async (email) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to LeetJudge Premium! 🌟</h2>
            <p>Thank you for upgrading! You now have full access to editorial solutions, premium test cases, and priority judging.</p>
        </div>
    `;
    return emailProvider.sendEmail({ to: email, subject: 'Welcome to Premium!', html });
};

export const sendContestReminderEmail = async (email, contestName, time) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Contest Reminder ⏰</h2>
            <p>Don't forget! The contest <strong>${contestName}</strong> is starting at <strong>${time}</strong>.</p>
            <p>Get ready to compete and climb the leaderboard!</p>
        </div>
    `;
    return emailProvider.sendEmail({ to: email, subject: `Reminder: ${contestName} is starting soon!`, html });
};