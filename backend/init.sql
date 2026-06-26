-- Create enum types
CREATE TYPE role_enum AS ENUM ('USER', 'ADMIN', 'PROBLEM_SETTER', 'MODERATOR');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE format_enum AS ENUM ('STANDARD', 'ICPC', 'IOI');
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
    role role_enum DEFAULT 'USER'
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Problem Table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    editorial TEXT,
    is_editorial_visible BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    difficulty difficulty_enum NOT NULL,
    created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
    timelimit INT NOT NULL,
    memorylimit INT NOT NULL
);

-- Contest Table
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    format format_enum NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_by UUID REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contest_problems (
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    problem_order INT NOT NULL,
    max_score INT NOT NULL,
    PRIMARY KEY (contest_id, problem_id),
    UNIQUE(contest_id, problem_order)
);

CREATE TABLE IF NOT EXISTS contest_participants (
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_rank INT,
    final_score INT DEFAULT 0,
    PRIMARY KEY (contest_id, user_id)
);

CREATE INDEX idx_contests_start_time ON contests(start_time);
CREATE INDEX idx_contest_problems_contest ON contest_problems(contest_id);
CREATE INDEX idx_contest_participants_contest ON contest_participants(contest_id);
CREATE INDEX idx_contest_participants_user ON contest_participants(user_id);

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
    contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    lang SMALLINT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verdict verdict_enum DEFAULT 'PENDING',
    verdict_message TEXT,
    execution_time_ms INT,
    memory_used_kb INT,
    error_test_case INT,
    expected_output TEXT,
    actual_output TEXT,
    ai_analysis JSONB
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

-- Problem Editors Table (Many-to-Many mapping for edit access)
CREATE TABLE IF NOT EXISTS problem_editors (
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (problem_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_editors_problem_id ON problem_editors(problem_id);
