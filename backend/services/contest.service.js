import * as contestdb from '../repositories/contest.repository.js';
import { createSubmissionService } from './submission.service.js';

export const createContestService = async (contestData) => {
    if (!contestData.name || contestData.name.trim().length === 0) {
        throw new Error('Contest name is required');
    }

    const validFormats = ['STANDARD', 'ICPC', 'IOI'];
    if (!validFormats.includes(contestData.format)) {
        throw new Error('Format must be one of: STANDARD, ICPC, IOI');
    }

    if (
        new Date(contestData.start_time) >=
        new Date(contestData.end_time)
    ) {
        throw new Error(
            'End time must be after start time'
        );
    }

    return contestdb.create(contestData);
};

export const getAllContestsService = async (offset, userId, userRole) => {
    const limit = 50;

    const contests = await contestdb.findAll(
        Number(offset) || 0,
        limit
    );

    if (userRole === 'ADMIN') {
        return contests;
    }

    return contests.filter(c => c.is_public || c.created_by === userId);
};

export const getContestByIdService = async (
    contestId
) => {
    const contest =
        await contestdb.findById(contestId);

    if (!contest) {
        throw new Error('Contest not found');
    }

    return contest;
};

export const updateContestService = async (
    contestId,
    updates,
    userId,
    userRole
) => {

    const contest =
        await getContestByIdService(contestId);

    if (
        contest.created_by !== userId &&
        userRole !== 'ADMIN'
    ) {
        throw new Error(
            'Forbidden: Insufficient permissions to update contest'
        );
    }

    const now = new Date();

    if (
        now >= new Date(contest.start_time)
    ) {
        throw new Error(
            'Contest has already started'
        );
    }

    const startTime =
        updates.start_time ??
        contest.start_time;

    const endTime =
        updates.end_time ??
        contest.end_time;

    if (
        new Date(startTime) >=
        new Date(endTime)
    ) {
        throw new Error(
            'End time must be after start time'
        );
    }

    return contestdb.updateContest(
        contestId,
        updates
    );
};

export const deleteContestService = async (
    contestId,
    userId,
    userRole
) => {

    const contest =
        await getContestByIdService(contestId);

    if (
        contest.created_by !== userId &&
        userRole !== 'ADMIN'
    ) {
        throw new Error(
            'Forbidden: Insufficient permissions to delete contest'
        );
    }

    const now = new Date();

    if (
        now >= new Date(contest.start_time) &&
        now <= new Date(contest.end_time)
    ) {
        throw new Error(
            'Cannot delete active contest'
        );
    }

    return contestdb.deleteContest(
        contestId
    );
};

export const registerForContestService = async (
    contestId,
    userId
) => {

    const contest =
        await getContestByIdService(contestId);

    const now = new Date();

    if (
        now >= new Date(contest.start_time)
    ) {
        throw new Error(
            'Contest has already started'
        );
    }

    const registration =
        await contestdb.addParticipant(
            contestId,
            userId
        );

    if (!registration) {
        throw new Error(
            'User already registered'
        );
    }

    return registration;
};

export const getRegistrationStatusService =
async (
    contestId,
    userId
) => {

    await getContestByIdService(
        contestId
    );

    const participant =
        await contestdb.getParticipant(
            contestId,
            userId
        );

    return {
        isRegistered: !!participant,
        details: participant || null
    };
};

export const getContestParticipantsService =
async (
    contestId
) => {

    await getContestByIdService(
        contestId
    );

    return contestdb.getParticipants(
        contestId
    );
};

export const getContestProblemsService =
async (
    contestId,
    userId,
    userRole
) => {

    const contest = await getContestByIdService(
        contestId
    );

    const now = new Date();
    if (
        now < new Date(contest.start_time) &&
        contest.created_by !== userId &&
        userRole !== 'ADMIN'
    ) {
        throw new Error(
            'Forbidden: Cannot view problems before contest starts'
        );
    }

    return contestdb.getProblems(
        contestId
    );
};

export const editContestProblemsService =
async (
    contestId,
    problems,
    userId,
    userRole
) => {

    const contest =
        await getContestByIdService(
            contestId
        );

    if (
        contest.created_by !== userId &&
        userRole !== 'ADMIN'
    ) {
        throw new Error(
            'Forbidden: Insufficient permissions to edit problems'
        );
    }

    const now = new Date();

    if (
        now >= new Date(contest.start_time)
    ) {
        throw new Error(
            'Cannot edit problems after contest start'
        );
    }

    if (!Array.isArray(problems)) {
        throw new Error(
            'Problems must be an array'
        );
    }

    for (const problem of problems) {

        if (!problem.problem_id) {
            throw new Error(
                'problem_id is required'
            );
        }

        if (
            !Number.isInteger(
                problem.problem_order
            )
        ) {
            throw new Error(
                'problem_order must be an integer'
            );
        }

        if (
            !Number.isInteger(
                problem.max_score
            ) ||
            problem.max_score <= 0
        ) {
            throw new Error(
                'max_score must be positive'
            );
        }
    }

    await contestdb.updateProblems(
        contestId,
        problems
    );

    return {
        message:
            'Problems updated successfully'
    };
};

export const submitContestSolutionService =
async ({
    contestId,
    problemId,
    userId,
    code,
    lang
}) => {

    const participant =
        await contestdb.getParticipant(
            contestId,
            userId
        );

    if (!participant) {
        throw new Error(
            'User is not registered for this contest'
        );
    }

    const contest =
        await getContestByIdService(
            contestId
        );

    const now = new Date();

    if (
        now < new Date(contest.start_time) ||
        now > new Date(contest.end_time)
    ) {
        throw new Error(
            'Contest is not active'
        );
    }

    const problems =
        await contestdb.getProblems(
            contestId
        );

    const problemExists =
        problems.some(
            p => p.id === problemId
        );

    if (!problemExists) {
        throw new Error(
            'Problem does not belong to this contest'
        );
    }

    return createSubmissionService({
        userId,
        problemId,
        contestId,
        code,
        lang
    });
};

export const getContestSubmissionsService =
async (
    contestId,
    userId
) => {

    await getContestByIdService(
        contestId
    );

    return contestdb.getSubmissions(
        contestId,
        userId
    );
};

export const getContestLeaderboardService =
async (
    contestId
) => {

    await getContestByIdService(
        contestId
    );

    return contestdb.getLeaderboard(
        contestId
    );
};