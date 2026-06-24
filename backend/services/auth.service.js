// Auth service - uses repository layer for DB access and utility functions for hashing/tokens
// Pattern: Service Layer pattern - business logic lives here, data access is delegated to repositories
import * as accountRepo from '../repositories/account.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendWelcomeEmail, sendLoginAlertEmail } from './email.service.js';

import { getLocationFromIP } from '../utils/geo.util.js';

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