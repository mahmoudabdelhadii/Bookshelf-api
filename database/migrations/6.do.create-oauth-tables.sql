-- Migration 6: Create OAuth Tables
-- Creates OAuth-specific tables for external authentication

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- OAuth Profile table for external authentication providers
CREATE TABLE server."oauth_profile" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
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

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_oauth_profile_updated_at
    BEFORE UPDATE ON server."oauth_profile"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE server."oauth_profile" IS 'OAuth profiles for external authentication providers';