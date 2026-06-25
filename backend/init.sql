-- Create enum types
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN', 'PROBLEM_SETTER', 'MODERATOR');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE verdict_enum AS ENUM (
    'PENDING',
    'COMPILING',
    'RUNNING',
    'ACCEPTED',
    'WRONG_ANSWER',
    'TIME_LIMIT_EXCEEDED',
    'MEMORY_LIMIT_EXCEEDED',
    'RUNTIME_ERROR',
    'COMPILATION_ERROR',
    'INTERNAL_ERROR'
);

-- Note: The `tags` field in problem will be a simple text array or varchar array representing enums, 
-- or we can use a separate tags table. To keep it simple based on the schema `List<enum>`, we can use an array of text.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Account Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    role role_enum DEFAULT 'USER'
);

-- Problem Table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    difficulty difficulty_enum NOT NULL,
    created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
    timelimit INT NOT NULL,
    memorylimit INT NOT NULL
);

-- Test Case Table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL
);

-- Submission Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    lang SMALLINT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verdict verdict_enum DEFAULT 'PENDING',
    verdict_message TEXT,
    execution_time_ms INT,
    memory_used_kb INT,
    error_test_case INT,
    expected_output TEXT,
    actual_output TEXT
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);

-- OTP Table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
