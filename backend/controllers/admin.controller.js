import { updateRole as updateRoleRepo, findByEmail } from '../repositories/account.repository.js';
import { getDashboardAnalytics } from '../repositories/admin.repository.js';
import logger from '../utils/logger.js';

export const updateRole = async (req, res) => {
    try {
        const { email, newRole } = req.body;

        if (!email || !newRole) {
            return res.status(400).json({ error: 'Email and newRole are required' });
        }

        const validRoles = ['USER', 'ADMIN', 'PROBLEM_SETTER', 'MODERATOR'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user exists
        const user = await findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update role
        const updatedUser = await updateRoleRepo(email, newRole);

        logger.info('Admin', `Admin ${req.user.id} updated role for ${email} to ${newRole}`);

        res.status(200).json({
            message: 'Role updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        logger.error('Admin', `Failed to update role: ${error.message}`);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
};

export const getAnalytics = async (req, res) => {
    try {
        const analytics = await getDashboardAnalytics();
        res.status(200).json(analytics);
    } catch (error) {
        logger.error('Admin', `Failed to fetch analytics: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
};
