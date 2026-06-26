import express from 'express';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';

import {
    createContest,
    getAllContests,
    getContestById,
    updateContest,
    deleteContest,

    registerForContest,
    getRegistrationStatus,
    getContestParticipants,

    getContestProblems,
    editContestProblems,

    submitContestSolution,
    getContestSubmissions,

    getContestLeaderboard
} from '../controllers/contest.controller.js';

const router = express.Router();

/**
 * Contest Management
 */

// Create Contest
router.post('/', authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), createContest);

// Get All Contests
router.get('/', optionalAuthenticate, getAllContests);

// Get Contest Details
router.get('/:contestId', optionalAuthenticate, getContestById);

// Update Contest
router.patch('/:contestId', authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), updateContest);

// Delete Contest
router.delete('/:contestId', authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), deleteContest);

/**
 * Registration
 */

// Register For Contest
router.post(
    '/:contestId/register',
    authenticate,
    registerForContest
);

// Check Registration Status
router.get(
    '/:contestId/registration-status',
    authenticate,
    getRegistrationStatus
);

// Get Contest Participants
router.get(
    '/:contestId/participants',
    getContestParticipants
);

/**
 * Contest Problems
 */

// Get Problems In Contest
router.get(
    '/:contestId/problems',
    optionalAuthenticate,
    getContestProblems
);

// Edit Problems In Contest
router.put(
    '/:contestId/problems',
    authenticate,
    requireRole(['ADMIN', 'PROBLEM_SETTER']),
    editContestProblems
);

/**
 * Contest Submissions
 */

// Submit Solution
router.post(
    '/:contestId/problems/:problemId/submit',
    authenticate,
    submitContestSolution
);

// Get Contest Submissions
router.get(
    '/:contestId/submissions',
    authenticate,
    getContestSubmissions
);

/**
 * Leaderboard
 */

router.get(
    '/:contestId/leaderboard',
    getContestLeaderboard
);

export default router;