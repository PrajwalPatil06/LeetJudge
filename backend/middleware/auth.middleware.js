// Auth middleware - verifies JWT tokens on protected routes
import { verifyToken } from '../utils/jwt.util.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // attach user payload (id, role) to request
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Token is invalid or expired' });
    }
};

export const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // attach user payload if valid
    } catch (err) {
        // ignore invalid token for optional auth
    }
    next();
};

// Middleware to check if user has a specific role (e.g. ADMIN, PROBLEM_SETTER)
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};