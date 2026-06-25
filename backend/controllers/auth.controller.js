import { signupService, loginService, getMeService, googleLoginService } from '../services/auth.service.js';

export const signup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        // Basic validation
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newUser = await signupService({ name, username, email, password });
        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Extract User-Agent for device info and pass IP
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const { user, token } = await loginService(email, password, req.ip, userAgent);
        res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getMeService(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: "Google credential is required" });
        }
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const { user, token } = await googleLoginService(credential, req.ip, userAgent);
        res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};