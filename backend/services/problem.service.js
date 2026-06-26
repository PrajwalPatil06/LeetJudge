// Problem service - uses repository layer for DB access
// Pattern: Service Layer pattern - orchestrates business logic across problem and test case repos
import * as problemRepo from '../repositories/problem.repository.js';
import * as testcaseRepo from '../repositories/testcase.js';

export const getAllProblems = async (limit = 50, offset = 0) => {
    return problemRepo.findAll(limit, offset);
};

export const createProblemService = async (problemData) => {
    return problemRepo.create(problemData);
};

export const addTestCasesService = async (problemId, testCases) => {
    // First verify the problem exists
    const problem = await problemRepo.findById(problemId);
    if (!problem) {
        throw new Error('Problem not found');
    }

    return testcaseRepo.createMany(problemId, testCases);
};

export const getProblemByIdService = async (problemId) => {
    const problem = await problemRepo.findById(problemId);

    if (problem) {
        // Attach test cases to the problem object
        const testCases = await testcaseRepo.findByProblemId(problemId);
        problem.testCases = testCases;
    }

    return problem;
};

export const updateProblemService = async (problemId, problemData) => {
    return problemRepo.update(problemId, problemData);
};

export const deleteProblemService = async (problemId) => {
    return problemRepo.deleteProblem(problemId);
};

export const addProblemEditorService = async (problemId, userId) => {
    return problemRepo.addEditor(problemId, userId);
};

export const getProblemEditorsService = async (problemId) => {
    return problemRepo.getEditors(problemId);
};