# Testing Guide for LeetJudge

This guide explains the workflow for writing and running test cases in the `backend` of LeetJudge.

## Tools Used
- **[Jest](https://jestjs.io/)**: The core testing framework and assertion library.
- **[Supertest](https://github.com/ladjs/supertest)**: The HTTP assertion library used to simulate requests to our Express application without starting a real HTTP server.

## Folder Structure
All test files should reside inside the `backend/tests/` directory and must end with the `.test.js` extension (e.g., `health.test.js`, `userController.test.js`). Jest will automatically find and run these files.

## Running Tests
To run all test cases, use the following command from the `backend/` directory:
```bash
npm test
```

## How to Add a New Test Case

1. **Create the Test File:**
   Create a new file in the `tests/` directory, for example, `example.test.js`.

2. **Import Required Modules:**
   You will need `supertest` to make HTTP calls and the Express `app` to handle them.
   ```javascript
   import request from 'supertest';
   import app from '../app.js';
   ```

3. **Write the Test Block:**
   Use `describe` to group related tests and `it` for individual test cases. Use `expect` to perform assertions.
   ```javascript
   describe('Example API Endpoints', () => {
       it('should return 200 on GET /example', async () => {
           // Arrange & Act
           const response = await request(app).get('/example');
           
           // Assert
           expect(response.status).toBe(200);
           expect(response.body).toHaveProperty('success', true);
       });
   });
   ```

4. **Common Assertions:**
   - `expect(response.status).toBe(200);` - Checks the HTTP status code.
   - `expect(response.body).toEqual({ ... });` - Deeply compares the JSON response payload.
   - `expect(response.body).toHaveProperty('key');` - Checks if a JSON property exists.

## Best Practices
- **Do not use `app.listen()` inside tests:** The test framework works directly with the Express instance in memory, meaning you don't need to manually start the server or worry about port collisions.
- **Keep tests isolated:** Each test case (`it` block) should be independent and not rely on the execution order of other tests.
- **Mock External Services:** If your endpoint talks to a database or a third-party API, consider mocking those services to ensure tests run fast and deterministically.
