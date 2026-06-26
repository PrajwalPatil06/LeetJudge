import {
    createContestService,
    getAllContestsService,
    getContestByIdService,
    updateContestService,
    deleteContestService,
    registerForContestService,
    getRegistrationStatusService,
    getContestParticipantsService,
    getContestProblemsService,
    editContestProblemsService,
    submitContestSolutionService,
    getContestSubmissionsService,
    getContestLeaderboardService
} from '../services/contest.service.js';

export const createContest = async (req, res) => {
    try {
        const contest = await createContestService({
            ...req.body,
            created_by: req.user.id
        });
        res.status(201).json(contest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllContests = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const contests = await getAllContestsService(offset, req.user?.id, req.user?.role);
        res.status(200).json(contests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContestById = async (req, res) => {
    try {
        const contest = await getContestByIdService(req.params.contestId);
        res.status(200).json(contest);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const updateContest = async (req, res) => {
    try {
        const contest = await updateContestService(
            req.params.contestId,
            req.body,
            req.user.id,
            req.user.role
        );
        res.status(200).json(contest);
    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: error.message });
    }
};

export const deleteContest = async (req, res) => {
    try {
        await deleteContestService(req.params.contestId, req.user.id, req.user.role);
        res.status(200).json({ message: 'Contest deleted successfully' });
    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: error.message });
    }
};

export const registerForContest = async (req, res) => {
    try {
        const registration = await registerForContestService(req.params.contestId, req.user.id);
        res.status(201).json(registration);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getRegistrationStatus = async (req, res) => {
    try {
        const status = await getRegistrationStatusService(req.params.contestId, req.user.id);
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContestParticipants = async (req, res) => {
    try {
        const participants = await getContestParticipantsService(req.params.contestId);
        res.status(200).json(participants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContestProblems = async (req, res) => {
    try {
        const problems = await getContestProblemsService(
            req.params.contestId,
            req.user?.id,
            req.user?.role
        );
        res.status(200).json(problems);
    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : 500;
        res.status(status).json({ error: error.message });
    }
};

export const editContestProblems = async (req, res) => {
    try {
        const result = await editContestProblemsService(
            req.params.contestId,
            req.body.problems,
            req.user.id,
            req.user.role
        );
        res.status(200).json(result);
    } catch (error) {
        const status = error.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: error.message });
    }
};

export const submitContestSolution = async (req, res) => {
    try {
        const submission = await submitContestSolutionService({
            contestId: req.params.contestId,
            problemId: req.params.problemId,
            userId: req.user.id,
            code: req.body.code,
            lang: req.body.lang
        });
        res.status(201).json(submission);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getContestSubmissions = async (req, res) => {
    try {
        const submissions = await getContestSubmissionsService(req.params.contestId, req.user.id);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getContestLeaderboard = async (req, res) => {
    try {
        const leaderboard = await getContestLeaderboardService(req.params.contestId);
        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};