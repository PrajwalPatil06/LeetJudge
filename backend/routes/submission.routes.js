import express from 'express';
import { submitCode, getSubmissionById, getMySubmissions, getUserSubmissionsForProblem} from '../controllers/submission.controller.js';
const router = express.Router();
router.post("/", submitCode);
router.get("/mySubmissions", getMySubmissions)
router.get("/:submissionsId", getSubmissionById);
router.get("/problem/:problemId/user/:userId", getUserSubmissionsForProblem);
export default router;