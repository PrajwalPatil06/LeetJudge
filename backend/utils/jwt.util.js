import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};