import express from 'express';
import { getProblems, getProblemById, createProblem, addTestCases} from '../controllers/problem.controller.js'
const router = express.Router();
router.get("/", getProblems);
router.post("/", createProblem);
router.post("/:problemId/testcases", addTestCases);
router.get("/:problemId", getProblemById);
export default router;