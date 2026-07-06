-- Database DDL Schema for PostgreSQL
-- Use these queries to initialize the PostgreSQL database schema for the Weekly Report Generator.

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('MEMBER', 'MANAGER')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Projects / Work Categories Table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    week_start DATE NOT NULL, -- Always stored as the Monday date of the report week
    tasks_completed TEXT NOT NULL, -- JSON string array of completed tasks
    tasks_planned TEXT NOT NULL,   -- JSON string array of planned tasks
    blockers TEXT NOT NULL,        -- JSON string array of blockers
    hours_worked INTEGER,          -- Optional workload hours
    notes TEXT,                    -- Optional links or notes
    status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED')),
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    read_by_manager BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reports_week_start ON reports (week_start);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports (project_id);

-- 5. Seed Data Queries
-- Seed Default Project Categories
INSERT INTO projects (name, description) VALUES
('Client A', 'Development and support for Client A portal.'),
('Internal Tooling', 'Building libraries and workflows for the internal engineering team.'),
('R&D', 'Research and prototyping of next-generation features.'),
('Marketing Campaign', 'Technical support and data integrations for marketing activities.')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Accounts
-- Default passwords:
-- manager@example.com -> 'manager123'
-- member@example.com -> 'member123'
-- dev@example.com -> 'member123'

INSERT INTO users (email, password, name, role) VALUES
('manager@example.com', '$2a$10$d62q/iB43Z9HkE2K8G9qHeUfX.K6w4JqUqfUfUqfUqfUqfUqfUqfU', 'Jane Doe (Manager)', 'MANAGER'),
('member@example.com', '$2a$10$Y1wH1rZ4wK5G9qHeUfX.K6w4JqUqfUfUqfUqfUqfUqfUqfUqfU', 'John Smith (Member)', 'MEMBER'),
('dev@example.com', '$2a$10$Y1wH1rZ4wK5G9qHeUfX.K6w4JqUqfUfUqfUqfUqfUqfUqfUqfU', 'Alex Carter (Developer)', 'MEMBER')
ON CONFLICT (email) DO NOTHING;
