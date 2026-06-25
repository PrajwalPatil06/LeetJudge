// Auth service - uses repository layer for DB access and utility functions for hashing/tokens
// Pattern: Service Layer pattern - business logic lives here, data access is delegated to repositories
import * as accountRepo from '../repositories/account.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendWelcomeEmail, sendLoginAlertEmail } from './email.service.js';

import { getLocationFromIP } from '../utils/geo.util.js';
import { verifyGoogleToken } from '../utils/google.util.js';

export const signupService = async ({ name, username, email, password }) => {
    // Check if email is already taken
    const existingEmail = await accountRepo.findByEmail(email);
    if (existingEmail) {
        throw new Error('User with this email already exists');
    }

    // Check if username is already taken
    const existingUsername = await accountRepo.findByUsername(username);
    if (existingUsername) {
        throw new Error('User with this username already exists');
    }

    const passwordHash = await hashPassword(password);

    const newUser = await accountRepo.create({
        name,
        username,
        email,
        passwordHash,
        role: 'USER'
    });

    // Strip the password hash before returning
    delete newUser.password_hash;
    
    // Send welcome email asynchronously
    sendWelcomeEmail(newUser.email, newUser.name).catch(err => {
        console.error('Failed to send welcome email:', err.message);
    });
    
    return newUser;
};

export const loginService = async (email, password, ip, userAgent) => {
    const user = await accountRepo.findByEmail(email);

    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (!user.password_hash) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    const token = generateToken({ id: user.id, role: user.role });

    // Strip the password hash before returning
    delete user.password_hash;
    
    // Send login alert email asynchronously
    const time = new Date().toLocaleString();
    
    // Attempt geolocation
    getLocationFromIP(ip).then(loc => {
        // Strip IPv4 mapping prefix
        let cleanIp = ip || 'Unknown';
        if (cleanIp.startsWith('::ffff:')) {
            cleanIp = cleanIp.substring(7);
        }

        // Only display location if it's meaningful
        const isUnknown = loc === 'Unknown Region' || loc === 'Local Network (Development)';
        const locationDisplay = isUnknown ? null : loc;

        sendLoginAlertEmail(user.email, cleanIp, locationDisplay, userAgent, time).catch(err => {
            console.error('Failed to send login alert email:', err.message);
        });
    });

    return { user, token };
};

export const getMeService = async (userId) => {
    const user = await accountRepo.findById(userId);
    if (user) {
        delete user.password_hash;
    }
    return user;
};

const generateUniqueUsername = async (email) => {
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
    let username = base;
    let counter = 1;
    while (await accountRepo.findByUsername(username)) {
        username = `${base}${counter}`;
        counter++;
    }
    return username;
};

const sendLoginAlert = (user, ip, userAgent) => {
    const time = new Date().toLocaleString();
    getLocationFromIP(ip).then(loc => {
        let cleanIp = ip || 'Unknown';
        if (cleanIp.startsWith('::ffff:')) {
            cleanIp = cleanIp.substring(7);
        }
        const isUnknown = loc === 'Unknown Region' || loc === 'Local Network (Development)';
        const locationDisplay = isUnknown ? null : loc;
        sendLoginAlertEmail(user.email, cleanIp, locationDisplay, userAgent, time).catch(err => {
            console.error('Failed to send login alert email:', err.message);
        });
    });
};

export const googleLoginService = async (credential, ip, userAgent) => {
    const payload = await verifyGoogleToken(credential);
    const { sub: googleId, email, name, email_verified: emailVerified } = payload;

    if (!email || !emailVerified) {
        throw new Error('Google account email is not verified');
    }

    let user = await accountRepo.findByGoogleId(googleId);

    if (!user) {
        const existingEmail = await accountRepo.findByEmail(email);
        if (existingEmail) {
            user = await accountRepo.linkGoogleId(existingEmail.id, googleId);
        } else {
            const username = await generateUniqueUsername(email);
            user = await accountRepo.create({
                name: name || email.split('@')[0],
                username,
                email,
                googleId,
                role: 'USER',
            });
            sendWelcomeEmail(user.email, user.name).catch(err => {
                console.error('Failed to send welcome email:', err.message);
            });
        }
    }

    const token = generateToken({ id: user.id, role: user.role });
    delete user.password_hash;
    sendLoginAlert(user, ip, userAgent);
    return { user, token };
};