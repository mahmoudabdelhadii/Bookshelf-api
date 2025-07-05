-- Migration 6: Create Auth Tables
-- Creates all authentication and authorization tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Sessions table for session management
CREATE TABLE server."user_session" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for user_session
CREATE UNIQUE INDEX "unique_session_token" ON server."user_session"(session_token);
CREATE UNIQUE INDEX "unique_refresh_token" ON server."user_session"(refresh_token) WHERE refresh_token IS NOT NULL;
CREATE INDEX "idx_user_sessions_user_id" ON server."user_session"(user_id);
CREATE INDEX "idx_user_sessions_expires_at" ON server."user_session"(expires_at);

-- Password Reset Tokens table
CREATE TABLE server."password_reset_token" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for password_reset_token
CREATE UNIQUE INDEX "unique_password_reset_token" ON server."password_reset_token"(token);
CREATE INDEX "idx_password_reset_user_id" ON server."password_reset_token"(user_id);
CREATE INDEX "idx_password_reset_expires_at" ON server."password_reset_token"(expires_at);

-- Email Verification Tokens table
CREATE TABLE server."email_verification_token" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for email_verification_token
CREATE UNIQUE INDEX "unique_email_verification_token" ON server."email_verification_token"(token);
CREATE INDEX "idx_email_verification_user_id" ON server."email_verification_token"(user_id);
CREATE INDEX "idx_email_verification_expires_at" ON server."email_verification_token"(expires_at);

-- Login Attempts table for rate limiting and security monitoring
CREATE TABLE server."login_attempt" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    is_successful BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_agent TEXT,
    failure_reason TEXT -- e.g., "invalid_password", "account_locked", "invalid_email"
);

-- Create indexes for login_attempt
CREATE INDEX "idx_login_attempts_email" ON server."login_attempt"(email);
CREATE INDEX "idx_login_attempts_ip" ON server."login_attempt"(ip_address);
CREATE INDEX "idx_login_attempts_attempted_at" ON server."login_attempt"(attempted_at);

-- User Roles table for Role-Based Access Control (RBAC)
CREATE TABLE server."role" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[], -- JSON array of permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index for role name
CREATE UNIQUE INDEX "unique_role_name" ON server."role"(name);

-- User-Role Assignment table (many-to-many relationship)
CREATE TABLE server."user_role" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES server."role"(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    assigned_by TEXT REFERENCES server."user"(id)
);

-- Create indexes for user_role
CREATE UNIQUE INDEX "unique_user_role" ON server."user_role"(user_id, role_id);
CREATE INDEX "idx_user_roles_user_id" ON server."user_role"(user_id);
CREATE INDEX "idx_user_roles_role_id" ON server."user_role"(role_id);

-- Security Audit Log table
CREATE TABLE server."security_audit_log" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES server."user"(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., "login", "logout", "password_change", "role_change"
    details TEXT, -- JSON string with additional details
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' -- "info", "warning", "critical"
);

-- Create indexes for security_audit_log
CREATE INDEX "idx_audit_log_user_id" ON server."security_audit_log"(user_id);
CREATE INDEX "idx_audit_log_action" ON server."security_audit_log"(action);
CREATE INDEX "idx_audit_log_timestamp" ON server."security_audit_log"(timestamp);
CREATE INDEX "idx_audit_log_severity" ON server."security_audit_log"(severity);

-- Account Lockout table for security
CREATE TABLE server."account_lockout" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL, -- e.g., "too_many_failed_attempts", "security_violation"
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for account_lockout
CREATE INDEX "idx_account_lockout_user_id" ON server."account_lockout"(user_id);
CREATE INDEX "idx_account_lockout_locked_until" ON server."account_lockout"(locked_until);

-- OAuth Profile table for external authentication providers
CREATE TABLE server."oauth_profile" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., "google", "apple", "github"
    provider_id TEXT NOT NULL, -- Provider's unique user ID
    email TEXT NOT NULL,
    profile_data TEXT, -- JSON string with profile information
    access_token TEXT, -- Encrypted access token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for oauth_profile
CREATE UNIQUE INDEX "unique_oauth_provider_user" ON server."oauth_profile"(provider, provider_id);
CREATE UNIQUE INDEX "unique_oauth_user_provider" ON server."oauth_profile"(user_id, provider);
CREATE INDEX "idx_oauth_profile_user_id" ON server."oauth_profile"(user_id);
CREATE INDEX "idx_oauth_profile_provider" ON server."oauth_profile"(provider);
CREATE INDEX "idx_oauth_profile_email" ON server."oauth_profile"(email);