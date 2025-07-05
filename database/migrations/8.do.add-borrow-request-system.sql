-- Migration 8: Add borrow request system
-- This migration creates the borrow_request table and related enums

-- Create borrow request status enum
CREATE TYPE server.borrow_request_status AS ENUM (
    'pending',
    'approved', 
    'rejected',
    'borrowed',
    'returned',
    'overdue'
);

-- Create borrow_request table
CREATE TABLE server."borrow_request" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES server."user"(id) ON DELETE CASCADE,
    library_book_id UUID NOT NULL REFERENCES server."library_books"(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    approved_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    status server.borrow_request_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for borrow_request
CREATE INDEX "idx_borrow_request_user_id" ON server."borrow_request"(user_id);
CREATE INDEX "idx_borrow_request_library_book_id" ON server."borrow_request"(library_book_id);
CREATE INDEX "idx_borrow_request_status" ON server."borrow_request"(status);
CREATE INDEX "idx_borrow_request_due_date" ON server."borrow_request"(due_date);
CREATE INDEX "idx_borrow_request_request_date" ON server."borrow_request"(request_date);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_borrow_request_updated_at
    BEFORE UPDATE ON server."borrow_request"
    FOR EACH ROW
    EXECUTE FUNCTION server.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE server."borrow_request" IS 'Manages book borrowing requests with approval workflow';
COMMENT ON TYPE server.borrow_request_status IS 'Status of borrow requests from pending to returned';