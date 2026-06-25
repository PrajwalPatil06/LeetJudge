// Validates signup and login payloads before they reach the service layer

export const validateSignup = (req, res, next) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({
            error: 'All fields are required: name, username, email, password'
        });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: 'Password must be at least 6 characters'
        });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }

    next();
};

export const validateGoogleLogin = (req, res, next) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    next();
};