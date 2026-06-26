// compiling and running code
import { execFile } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import Language from '../models/language.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// base sandbox folder
const SANDBOX_BASE = join(__dirname, '..', '.sandbox_runs');

// getting language by id
const findLanguageById = (langId) => {
    return Object.values(Language).find(l => l.id === langId);
};

// compiling source code
export const compile = async (sandboxDir, langConfig) => {
    if (!langConfig.compileCmd) {
        // skipping interpreted language
        return { success: true };
    }

    const parts = langConfig.compileCmd.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    return new Promise((resolve) => {
        execFile(cmd, args, {
            cwd: sandboxDir,
            timeout: 15000 // timeout 15s
        }, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    success: false,
                    error: stderr || error.message
                });
            } else {
                resolve({ success: true });
            }
        });
    });
};

// running compiled code
export const execute = async (sandboxDir, langConfig, input, timeLimitMs, memoryLimitKb) => {
    const parts = langConfig.runCmd.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    return new Promise((resolve) => {
        const startTime = Date.now();

        const child = execFile(cmd, args, {
            cwd: sandboxDir,
            timeout: timeLimitMs + 500, // adding buffer
            maxBuffer: memoryLimitKb * 1024
        }, (error, stdout, stderr) => {
            const executionTimeMs = Date.now() - startTime;

            if (error) {
                // checking for tle
                if (error.killed || error.signal === 'SIGTERM') {
                    resolve({
                        success: false,
                        reason: 'TIME_LIMIT_EXCEEDED',
                        executionTimeMs,
                        stderr: stderr || ''
                    });
                } else {
                    resolve({
                        success: false,
                        reason: 'RUNTIME_ERROR',
                        executionTimeMs,
                        stderr: stderr || error.message
                    });
                }
            } else {
                resolve({
                    success: true,
                    stdout: stdout.trim(),
                    executionTimeMs
                });
            }
        });

        // Handle EPIPE error if process dies immediately
        child.stdin.on('error', (err) => {
            if (err.code !== 'EPIPE') {
                console.error('Sandbox stdin error:', err);
            }
        });

        // passing input
        if (input) {
            try {
                child.stdin.write(input);
            } catch (err) {
                // Catch any synchronous write errors just in case
            }
        }
        try {
            child.stdin.end();
        } catch (err) {
            // Ignore end errors
        }
    });
};

// executing everything
export const run = async (code, langId, input, timeLimitMs, memoryLimitKb) => {
    const langConfig = findLanguageById(langId);
    if (!langConfig) {
        return { success: false, reason: 'INTERNAL_ERROR', stderr: 'Unknown language' };
    }

    // creating isolated folder
    const sandboxId = randomUUID();
    const sandboxDir = join(SANDBOX_BASE, sandboxId);
    await mkdir(sandboxDir, { recursive: true });

    // deciding filename
    let filename = 'main' + langConfig.extension;
    // handling java class
    if (langConfig.extension === '.java') {
        filename = 'Main.java';
    }

    try {
        // writing code
        await writeFile(join(sandboxDir, filename), code);

        // compiling code
        const compileResult = await compile(sandboxDir, langConfig);
        if (!compileResult.success) {
            return {
                success: false,
                reason: 'COMPILATION_ERROR',
                stderr: compileResult.error
            };
        }

        // executing code
        const execResult = await execute(sandboxDir, langConfig, input, timeLimitMs, memoryLimitKb);
        return execResult;
    } finally {
        // cleaning up folder
        await rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
    }
};