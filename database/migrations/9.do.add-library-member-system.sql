-- Migration 9: Add library member system
-- This migration creates the library_member table and related enums

-- Create library member role enum
CREATE TYPE server.library_member_role AS ENUM (
    'owner',
    'manager',
    'staff',
    'member'
);

-- Create library_member table
CREATE TABLE server."library_member" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    library_id UUID NOT NULL REFERENCES server."library"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    role server.library_member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    invited_by UUID REFERENCES server."user"(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for library_member
CREATE INDEX "idx_library_member_library_id" ON server."library_member"(library_id);
CREATE INDEX "idx_library_member_user_id" ON server."library_member"(user_id);
CREATE INDEX "idx_library_member_role" ON server."library_member"(role);
CREATE INDEX "idx_library_member_joined_at" ON server."library_member"(joined_at);

-- Create unique constraint to prevent duplicate memberships
CREATE UNIQUE INDEX "unique_library_member" ON server."library_member"(library_id, user_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_library_member_updated_at
    BEFORE UPDATE ON server."library_member"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE server."library_member" IS 'Manages library membership with role-based access control';
COMMENT ON TYPE server.library_member_role IS 'Role hierarchy for library members from owner to member';