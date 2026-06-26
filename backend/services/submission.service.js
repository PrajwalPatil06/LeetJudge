// Submission service - handles creating submissions and queuing them for judging
// Pattern: Service Layer pattern - orchestrates business logic for submission lifecycle
import * as submissionRepo from '../repositories/submission.repository.js';
import * as problemRepo from '../repositories/problem.repository.js';
import { enqueueSubmission } from '../queue/redis.queue.js';
import logger from '../utils/logger.js';
import { AiAnalyzerContext } from './aiAnalyzer/aiAnalyzer.context.js';
import { GroqAnalyzerStrategy } from './aiAnalyzer/strategies/groq.strategy.js';

// Initialize AI Analyzer with Gemini Strategy (OCP)
const aiAnalyzer = new AiAnalyzerContext(new GroqAnalyzerStrategy());

export const createSubmissionService = async ({ userId, problemId, contestId, code, lang }) => {
    // Validate problem exists before accepting submission
    const problem = await problemRepo.findById(problemId);
    if (!problem) {
        throw new Error('Problem not found');
    }

    const submission = await submissionRepo.create({
        userId,
        problemId,
        contestId,
        code,
        language: lang
    });

    logger.debug('SubmissionService', `Submission ${submission.id} created for problem ${problemId}`);

    // Push submission onto the judge queue for async processing
    // Wrapped in try/catch so submission creation still succeeds even if queue is down
    try {
        await enqueueSubmission(submission.id);
    } catch (queueError) {
        logger.error('SubmissionService', 'Failed to enqueue submission for judging', queueError.message);
    }

    return submission;
};

export const getSubmissionByIdService = async (submissionId) => {
    return submissionRepo.findById(submissionId);
};

export const getMySubmissionsService = async (userId) => {
    return submissionRepo.findByUserId(userId);
};

export const getUserSubmissionsForProblemService = async (userId, problemId) => {
    return submissionRepo.findByUserAndProblem(userId, problemId);
};

export const getAiAnalysisForSubmissionService = async (submissionId) => {
    const submission = await submissionRepo.findById(submissionId);
    if (!submission) {
        throw new Error('Submission not found');
    }

    // Check if analysis already exists in the database
    if (submission.ai_analysis) {
        return submission.ai_analysis;
    }

    // If it's still pending/compiling/running, we can't analyze effectively, but we could.
    // Better to just wait until it's done.
    if (['PENDING', 'COMPILING', 'RUNNING'].includes(submission.verdict)) {
        throw new Error('Submission is still being judged. Please wait before analyzing.');
    }

    // Generate new analysis
    const problem = await problemRepo.findById(submission.problem_id);
    if (!problem) {
        throw new Error('Problem not found for this submission');
    }

    try {
        const analysis = await aiAnalyzer.analyze(submission.code, problem, submission.verdict);
        
        // Save back to database
        await submissionRepo.updateAiAnalysis(submissionId, analysis);
        
        return analysis;
    } catch (error) {
        logger.error('SubmissionService', `Failed to generate AI analysis: ${error.message}`);
        throw new Error('Failed to generate AI analysis');
    }
};