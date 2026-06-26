import * as problemService from '../services/problem.service.js';
import { uploadImageService, deleteImageService } from '../services/storage.service.js';
import { clearCache } from '../middleware/cache.middleware.js';
import { findByEmail } from '../repositories/account.repository.js';
import { getAllTags } from '../models/tag.js';

export const getProblems = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const { problems, total } = await problemService.getAllProblems(limit, offset);
        res.status(200).json({ problems, total, hasMore: offset + problems.length < total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const getTags = async (req, res) => {
    res.status(200).json({ tags: getAllTags() });
};

export const createProblem = async (req, res) => {
    try {
        const { title, description, tags, difficulty, timelimit, memorylimit, editorial, is_editorial_visible, is_hidden } = req.body;
        const createdBy = req.user.id;

        if (!title || !description || !difficulty || !timelimit || !memorylimit) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const validTimeLimits = [500, 1000, 2000, 5000];
        const validMemoryLimits = [65536, 131072, 262144, 524288];

        if (!validTimeLimits.includes(Number(timelimit))) {
            return res.status(400).json({ error: "Invalid time limit" });
        }

        if (!validMemoryLimits.includes(Number(memorylimit))) {
            return res.status(400).json({ error: "Invalid memory limit" });
        }

        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({ error: "Tags must be an array" });
        }

        const newProblem = await problemService.createProblemService({
            title, description, tags, difficulty, createdBy, timelimit, memorylimit, editorial, isEditorialVisible: is_editorial_visible, isHidden: is_hidden
        });

        // Invalidate cache
        await clearCache('cache:/api/problems');

        res.status(201).json({ message: "Problem created successfully", problem: newProblem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const addTestCases = async (req, res) => {
    try {
        const { problemId } = req.params;
        const { testCases } = req.body;

        if (!Array.isArray(testCases) || testCases.length === 0) {
            return res.status(400).json({ error: "Test cases must be a non-empty array" });
        }

        const addedTestCases = await problemService.addTestCasesService(problemId, testCases);
        res.status(201).json({ message: "Test cases added successfully", testCases: addedTestCases });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const getProblemById = async (req, res) => {
    try {
        const { problemId } = req.params;
        const problem = await problemService.getProblemByIdService(problemId);

        if (!problem) {
            return res.status(404).json({ error: "Problem not found" });
        }

        res.status(200).json({ problem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

// Check if user has edit permissions for a problem
const canEditProblem = async (problemId, userId, userRole) => {
    if (userRole === 'ADMIN') return true;
    
    const problem = await problemService.getProblemByIdService(problemId);
    if (!problem) return false;
    if (problem.created_by === userId) return true;

    const editors = await problemService.getProblemEditorsService(problemId);
    return editors.includes(userId);
};

export const updateProblem = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const hasPermission = await canEditProblem(problemId, userId, userRole);
        if (!hasPermission) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to edit this problem" });
        }

        const { title, description, tags, difficulty, timelimit, memorylimit, editorial, is_editorial_visible, is_hidden } = req.body;
        
        // Basic validation
        if (!title || !description || !difficulty || !timelimit || !memorylimit) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const updatedProblem = await problemService.updateProblemService(problemId, {
            title, description, tags, difficulty, timelimit, memorylimit, editorial, isEditorialVisible: is_editorial_visible, isHidden: is_hidden
        });

        // Invalidate cache
        await clearCache('cache:/api/problems');
        await clearCache(`cache:/api/problems/${problemId}`);

        res.status(200).json({ message: "Problem updated successfully", problem: updatedProblem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const deleteProblem = async (req, res) => {
    try {
        const { problemId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const hasPermission = await canEditProblem(problemId, userId, userRole);
        if (!hasPermission) {
            return res.status(403).json({ error: "Forbidden: You don't have permission to delete this problem" });
        }

        await problemService.deleteProblemService(problemId);

        // Invalidate cache
        await clearCache('cache:/api/problems');
        await clearCache(`cache:/api/problems/${problemId}`);

        res.status(200).json({ message: "Problem deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const addEditor = async (req, res) => {
    try {
        const { problemId } = req.params;
        const { email } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!email) {
             return res.status(400).json({ error: "Editor email is required" });
        }

        // Only creator or admin can add editors
        if (userRole !== 'ADMIN') {
            const problem = await problemService.getProblemByIdService(problemId);
            if (!problem || problem.created_by !== userId) {
                return res.status(403).json({ error: "Forbidden: Only the creator or an admin can add editors" });
            }
        }
        
        const editorUser = await findByEmail(email);
        if (!editorUser) {
            return res.status(404).json({ error: "User with this email not found" });
        }
        
        if (editorUser.role !== 'PROBLEM_SETTER' && editorUser.role !== 'ADMIN') {
            return res.status(400).json({ error: "User must be a Problem Setter or Admin to be added as an editor" });
        }

        await problemService.addProblemEditorService(problemId, editorUser.id);
        res.status(200).json({ message: "Editor added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An internal server error occurred" });
    }
};

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }
        
        const { url, fileId } = await uploadImageService(req.file);
        res.status(200).json({ url, fileId });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ error: "Failed to upload image" });
    }
};

export const deleteImage = async (req, res) => {
    try {
        const { fileId } = req.body;
        if (!fileId) {
            return res.status(400).json({ error: "No fileId provided" });
        }

        await deleteImageService(fileId);
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ error: "Failed to delete image" });
    }
};