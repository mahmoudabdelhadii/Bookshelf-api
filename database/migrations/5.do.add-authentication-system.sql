-- Migration 5: Add comprehensive authentication and authorization system
-- This migration adds all the necessary tables and modifications for a production-grade auth system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, modify the existing user table to use UUID instead of SERIAL
-- Create a new user table with UUID
CREATE TABLE server."user_new" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role server.role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Copy data from old table to new table (if any exists)
INSERT INTO server."user_new" (username, email, first_name, last_name, role, created_at, updated_at)
SELECT username, email, first_name, last_name, role, created_at, updated_at 
FROM server."user";

-- Drop old table and rename new one
DROP TABLE server."user" CASCADE;
ALTER TABLE server."user_new" RENAME TO "user";

-- Recreate indexes
CREATE UNIQUE INDEX "unique_email" ON server."user"(email);
CREATE UNIQUE INDEX "unique_username" ON server."user"(username);

-- Create user_auth table for authentication-specific data
CREATE TABLE server."user_auth" (
    user_id UUID PRIMARY KEY REFERENCES server."user"(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_password_change_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID REFERENCES server."user"(id),
    suspension_reason TEXT,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret TEXT, -- Encrypted TOTP secret
    backup_codes TEXT[], -- Encrypted backup codes
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_session table for session management
CREATE TABLE server."user_session" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
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

-- Create password_reset_token table
CREATE TABLE server."password_reset_token" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for password_reset_token
CREATE UNIQUE INDEX "unique_password_reset_token" ON server."password_reset_token"(token);
CREATE INDEX "idx_password_reset_user_id" ON server."password_reset_token"(user_id);
CREATE INDEX "idx_password_reset_expires_at" ON server."password_reset_token"(expires_at);

-- Create email_verification_token table
CREATE TABLE server."email_verification_token" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for email_verification_token
CREATE UNIQUE INDEX "unique_email_verification_token" ON server."email_verification_token"(token);
CREATE INDEX "idx_email_verification_user_id" ON server."email_verification_token"(user_id);
CREATE INDEX "idx_email_verification_expires_at" ON server."email_verification_token"(expires_at);

-- Create login_attempt table for security monitoring
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

-- Create role table for RBAC
CREATE TABLE server."role" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[], -- Array of permission strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index for role name
CREATE UNIQUE INDEX "unique_role_name" ON server."role"(name);

-- Create user_role table for many-to-many relationship
CREATE TABLE server."user_role" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES server."role"(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    assigned_by UUID REFERENCES server."user"(id)
);

-- Create indexes for user_role
CREATE UNIQUE INDEX "unique_user_role" ON server."user_role"(user_id, role_id);
CREATE INDEX "idx_user_roles_user_id" ON server."user_role"(user_id);
CREATE INDEX "idx_user_roles_role_id" ON server."user_role"(role_id);

-- Create security_audit_log table
CREATE TABLE server."security_audit_log" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES server."user"(id) ON DELETE SET NULL,
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

-- Create account_lockout table
CREATE TABLE server."account_lockout" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL, -- e.g., "too_many_failed_attempts", "security_violation"
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for account_lockout
CREATE INDEX "idx_account_lockout_user_id" ON server."account_lockout"(user_id);
CREATE INDEX "idx_account_lockout_locked_until" ON server."account_lockout"(locked_until);

-- Insert default roles
INSERT INTO server."role" (name, description, permissions) VALUES 
(
    'Super Administrator',
    'Full system access with all permissions',
    ARRAY[
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:list', 'user:manage', 'user:suspend', 'user:activate',
        'book:create', 'book:read', 'book:update', 'book:delete', 'book:list', 'book:search', 'book:manage', 'book:import', 'book:export', 'book:create:bulk', 'book:update:bulk', 'book:delete:bulk',
        'library:create', 'library:read', 'library:update', 'library:delete', 'library:list', 'library:manage',
        'library_book:create', 'library_book:read', 'library_book:update', 'library_book:delete', 'library_book:list', 'library_book:manage', 'library_book:transfer',
        'author:create', 'author:read', 'author:update', 'author:delete', 'author:list', 'author:search', 'author:manage',
        'publisher:create', 'publisher:read', 'publisher:update', 'publisher:delete', 'publisher:list', 'publisher:search', 'publisher:manage',
        'role:create', 'role:read', 'role:update', 'role:delete', 'role:list', 'role:manage', 'role:assign', 'role:revoke',
        'system:config', 'system:monitor', 'system:backup', 'system:restore', 'system:maintain', 'system:manage',
        'audit_log:read', 'audit_log:export', 'audit_log:manage', 'security:manage', 'security:monitor',
        'api:access', 'api:admin', 'integration:manage'
    ]
),
(
    'Administrator',
    'Administrative access to most system functions',
    ARRAY[
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:list', 'user:suspend', 'user:activate',
        'book:create', 'book:read', 'book:update', 'book:delete', 'book:list', 'book:search', 'book:import', 'book:export', 'book:create:bulk', 'book:update:bulk', 'book:delete:bulk',
        'library:create', 'library:read', 'library:update', 'library:delete', 'library:list',
        'library_book:create', 'library_book:read', 'library_book:update', 'library_book:delete', 'library_book:list', 'library_book:transfer',
        'author:create', 'author:read', 'author:update', 'author:delete', 'author:list', 'author:search',
        'publisher:create', 'publisher:read', 'publisher:update', 'publisher:delete', 'publisher:list', 'publisher:search',
        'audit_log:read', 'audit_log:export', 'security:monitor', 'api:access'
    ]
),
(
    'Librarian',
    'Manages library operations and book catalog',
    ARRAY[
        'user:read', 'user:list',
        'book:create', 'book:read', 'book:update', 'book:delete', 'book:list', 'book:search', 'book:import', 'book:export',
        'library:create', 'library:read', 'library:update', 'library:delete', 'library:list',
        'library_book:create', 'library_book:read', 'library_book:update', 'library_book:delete', 'library_book:list', 'library_book:transfer',
        'author:create', 'author:read', 'author:update', 'author:delete', 'author:list', 'author:search',
        'publisher:create', 'publisher:read', 'publisher:update', 'publisher:delete', 'publisher:list', 'publisher:search',
        'audit_log:read', 'api:access'
    ]
),
(
    'Reader',
    'Basic read access to library content',
    ARRAY[
        'user:read:own', 'user:update:own',
        'book:read', 'book:list', 'book:search',
        'author:read', 'author:list', 'author:search',
        'publisher:read', 'publisher:list', 'publisher:search',
        'library:read', 'library:list',
        'library_book:read', 'library_book:list',
        'api:access'
    ]
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION server.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at columns
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON server."user"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

CREATE TRIGGER update_user_auth_updated_at
    BEFORE UPDATE ON server."user_auth"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

CREATE TRIGGER update_role_updated_at
    BEFORE UPDATE ON server."role"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Create function to automatically clean up expired tokens
CREATE OR REPLACE FUNCTION server.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM server."password_reset_token"
    WHERE expires_at < NOW() AND is_used = FALSE;
    
    -- Delete expired email verification tokens
    DELETE FROM server."email_verification_token"
    WHERE expires_at < NOW() AND is_used = FALSE;
    
    -- Delete expired sessions
    DELETE FROM server."user_session"
    WHERE expires_at < NOW();
    
    -- Clean up old login attempts (keep last 30 days)
    DELETE FROM server."login_attempt"
    WHERE attempted_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old audit logs (keep last 90 days for info, longer for warnings/critical)
    DELETE FROM server."security_audit_log"
    WHERE timestamp < NOW() - INTERVAL '90 days' AND severity = 'info';
    
    DELETE FROM server."security_audit_log"
    WHERE timestamp < NOW() - INTERVAL '1 year' AND severity = 'warning';
END;
$$ LANGUAGE plpgsql;

-- Create function to log security events
CREATE OR REPLACE FUNCTION server.log_security_event(
    p_user_id UUID,
    p_action TEXT,
    p_details TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info'
)
RETURNS void AS $$
BEGIN
    INSERT INTO server."security_audit_log" (
        user_id, action, details, ip_address, user_agent, severity
    ) VALUES (
        p_user_id, p_action, p_details, p_ip_address, p_user_agent, p_severity
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE server."user_auth" IS 'Authentication-specific data for users';
COMMENT ON TABLE server."user_session" IS 'Active user sessions for authentication and session management';
COMMENT ON TABLE server."password_reset_token" IS 'Tokens for password reset functionality';
COMMENT ON TABLE server."email_verification_token" IS 'Tokens for email verification';
COMMENT ON TABLE server."login_attempt" IS 'Log of all login attempts for security monitoring';
COMMENT ON TABLE server."role" IS 'System roles with associated permissions';
COMMENT ON TABLE server."user_role" IS 'Assignment of roles to users';
COMMENT ON TABLE server."security_audit_log" IS 'Comprehensive security event logging';
COMMENT ON TABLE server."account_lockout" IS 'Account lockout tracking for security';

COMMENT ON FUNCTION server.cleanup_expired_tokens() IS 'Cleanup function for expired tokens and old logs';
COMMENT ON FUNCTION server.log_security_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Function to log security events consistently';