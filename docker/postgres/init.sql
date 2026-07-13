-- Create test database (optional)
SELECT 'CREATE DATABASE lms_testing'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'lms_testing'
)\gexec
