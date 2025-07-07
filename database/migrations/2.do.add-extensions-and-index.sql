-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION server.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_library_member_updated_at
    BEFORE UPDATE ON server."library_member"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();
CREATE TRIGGER update_book_updated_at
BEFORE UPDATE ON server.book
FOR EACH ROW EXECUTE FUNCTION server.update_updated_at_column();
-- Add comment for documentation
COMMENT ON TABLE server."library_member" IS 'Manages library membership with role-based access control';
COMMENT ON TYPE server.library_member_role IS 'Role hierarchy for library members from owner to member';
CREATE TRIGGER update_borrow_request_updated_at
    BEFORE UPDATE ON server."borrow_request"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE server."borrow_request" IS 'Manages book borrowing requests with approval workflow';
COMMENT ON TYPE server.borrow_request_status IS 'Status of borrow requests from pending to returned';
-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_oauth_profile_updated_at
    BEFORE UPDATE ON server."oauth_profile"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE server."oauth_profile" IS 'OAuth profiles for external authentication providers';

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

-- Add trigger to update updated_at timestamp for subject
CREATE OR REPLACE FUNCTION update_subject_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subject_updated_at_trigger
    BEFORE UPDATE ON server."subject"
    FOR EACH ROW
    EXECUTE FUNCTION update_subject_updated_at();
-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER library_updated_at_trigger
    BEFORE UPDATE ON server."library"
    FOR EACH ROW
    EXECUTE FUNCTION update_library_updated_at();
-- Create trigger for updating updated_at on publisher table
CREATE TRIGGER update_publisher_updated_at
    BEFORE UPDATE ON server."publisher"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN server."publisher"."address" IS 'Publisher address';
COMMENT ON COLUMN server."publisher"."website" IS 'Publisher website URL';
COMMENT ON COLUMN server."publisher"."founded_year" IS 'Year the publisher was founded';
COMMENT ON COLUMN server."publisher"."books_count" IS 'Count of books by this publisher';

CREATE TRIGGER update_author_updated_at
    BEFORE UPDATE ON server."author"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN server."author"."biography" IS 'Author biography text';
COMMENT ON COLUMN server."author"."birth_date" IS 'Author birth date as text';
COMMENT ON COLUMN server."author"."nationality" IS 'Author nationality';
COMMENT ON COLUMN server."author"."books_count" IS 'Count of books by this author';
COMMENT ON COLUMN server."book"."published_year" IS 'Year the book was published as integer';
