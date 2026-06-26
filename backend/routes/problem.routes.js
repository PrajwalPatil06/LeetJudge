import express from 'express';
import multer from 'multer';
import { getProblems, getProblemById, getTags, createProblem, addTestCases, updateProblem, deleteProblem, addEditor, uploadImage, deleteImage } from '../controllers/problem.controller.js';
import { authenticate, requireRole, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { validateCreateProblem, validateTestCases } from '../validators/problem.validator.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const conditionalCache = (duration) => {
    return (req, res, next) => {
        if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'PROBLEM_SETTER')) {
            return next();
        }
        return cacheMiddleware(duration)(req, res, next);
    };
};

router.get("/", optionalAuthenticate, conditionalCache(process.env.CACHE_TTL_PROBLEMS_LIST || 60), getProblems);
router.get("/tags", getTags);
router.post("/", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), validateCreateProblem, createProblem);

// Image upload and management routes (MUST be before /:problemId routes)
router.post("/upload-image", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), upload.single('image'), uploadImage);
router.delete("/delete-image", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), deleteImage);

router.post("/:problemId/testcases", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), validateTestCases, addTestCases);
router.get("/:problemId", cacheMiddleware(process.env.CACHE_TTL_PROBLEM_DETAIL || 300), getProblemById);

// New routes for editing, deleting, and advanced permissions
router.put("/:problemId", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), validateCreateProblem, updateProblem);
router.delete("/:problemId", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), deleteProblem);
router.post("/:problemId/editors", authenticate, requireRole(['ADMIN', 'PROBLEM_SETTER']), addEditor);

export default router;