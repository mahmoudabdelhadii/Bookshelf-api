CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


CREATE SCHEMA "server";

CREATE TYPE "server"."language" AS ENUM('en', 'ar', 'other');
CREATE TYPE "server"."role" AS ENUM('user', 'admin');
CREATE TYPE "server"."borrow_request_status" AS ENUM('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue');
CREATE TYPE "server"."library_member_role" AS ENUM('owner', 'manager', 'staff', 'member');
CREATE TABLE IF NOT EXISTS "server"."book" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"title" text NOT NULL,
	"title_long" text,
	"isbn" text,
	"isbn13" text,
	"dewey_decimal" text,
	"binding" text,
	"language" "server"."language" DEFAULT 'other' NOT NULL,
	"author_id" uuid NOT NULL,
	"publisher_id" uuid NOT NULL,
	"subject_id" uuid,
	"genre" text,
	"published_year" integer,
	"edition" text,
	"pages" integer,
	"overview" text,
	"image" text,
	"excerpt" text,
	"synopsis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_isbn_unique" UNIQUE("isbn")
);

CREATE TABLE IF NOT EXISTS "server"."library" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"city" text,
	"phone" text,
	"email" text,
	"website" text,
	"hours" text,
	"image" text,
	"rating" real,
	"owner_id" uuid NOT NULL,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."library_books" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"library_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"shelf_location" text,
	"condition" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."user" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "server"."role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."user_auth" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"last_password_change_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspended_by" uuid,
	"suspension_reason" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"backup_codes" text[],
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"last_failed_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."user_session" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"refresh_token" text,
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."password_reset_token" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."email_verification_token" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."login_attempt" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" text NOT NULL,
	"ip_address" text NOT NULL,
	"is_successful" boolean NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"failure_reason" text
);

CREATE TABLE IF NOT EXISTS "server"."user_role_type" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."user_role" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."security_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."account_lockout" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."oauth_profile" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"email" text NOT NULL,
	"profile_data" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."author" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"biography" text,
	"birth_date" text,
	"nationality" text,
	"books_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."publisher" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"website" text,
	"founded_year" integer,
	"books_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."subject" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent" uuid,
	"books_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."borrow_request" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"library_book_id" uuid NOT NULL,
	"request_date" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_date" timestamp with time zone,
	"approved_by" uuid,
	"due_date" timestamp with time zone,
	"return_date" timestamp with time zone,
	"status" "server"."borrow_request_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "server"."library_member" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"role" "server"."library_member_role" DEFAULT 'member' NOT NULL,
	"permissions" text[],
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "server"."book" ADD CONSTRAINT "book_author_id_author_id_fk" FOREIGN KEY ("author_id") REFERENCES "server"."author"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."book" ADD CONSTRAINT "book_publisher_id_publisher_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "server"."publisher"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."book" ADD CONSTRAINT "book_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "server"."subject"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library" ADD CONSTRAINT "library_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "server"."user"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library_books" ADD CONSTRAINT "library_books_library_id_library_id_fk" FOREIGN KEY ("library_id") REFERENCES "server"."library"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library_books" ADD CONSTRAINT "library_books_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "server"."book"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_auth" ADD CONSTRAINT "user_auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_auth" ADD CONSTRAINT "user_auth_suspended_by_user_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "server"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."email_verification_token" ADD CONSTRAINT "email_verification_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_role" ADD CONSTRAINT "user_role_role_id_user_role_type_id_fk" FOREIGN KEY ("role_id") REFERENCES "server"."user_role_type"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."user_role" ADD CONSTRAINT "user_role_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "server"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."security_audit_log" ADD CONSTRAINT "security_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."account_lockout" ADD CONSTRAINT "account_lockout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."oauth_profile" ADD CONSTRAINT "oauth_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."subject" ADD CONSTRAINT "subject_parent_subject_id_fk" FOREIGN KEY ("parent") REFERENCES "server"."subject"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."borrow_request" ADD CONSTRAINT "borrow_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."borrow_request" ADD CONSTRAINT "borrow_request_library_book_id_library_books_id_fk" FOREIGN KEY ("library_book_id") REFERENCES "server"."library_books"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."borrow_request" ADD CONSTRAINT "borrow_request_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "server"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library_member" ADD CONSTRAINT "library_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "server"."user"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library_member" ADD CONSTRAINT "library_member_library_id_library_id_fk" FOREIGN KEY ("library_id") REFERENCES "server"."library"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "server"."library_member" ADD CONSTRAINT "library_member_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "server"."user"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_isbn" ON "server"."book" USING btree ("isbn");
CREATE INDEX IF NOT EXISTS "books_title_trgm_idx" ON "server"."book" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "books_title_tsv_idx" ON "server"."book" USING gin ((
        to_tsvector('english', coalesce("title", '')) ||
        to_tsvector('arabic', coalesce("title", '')) ||
        to_tsvector('simple', coalesce("title", ''))
      ));
CREATE INDEX IF NOT EXISTS "books_search_idx" ON "server"."book" USING gin ((
        setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('arabic', coalesce("title", '')), 'A') ||
        setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||

        setweight(to_tsvector('english', coalesce("overview", '')), 'B') ||
        setweight(to_tsvector('arabic', coalesce("overview", '')), 'B') ||
        setweight(to_tsvector('simple', coalesce("overview", '')), 'B') ||

        setweight(to_tsvector('english', coalesce("excerpt", '')), 'C') ||
        setweight(to_tsvector('arabic', coalesce("excerpt", '')), 'C') ||
        setweight(to_tsvector('simple', coalesce("excerpt", '')), 'C') ||

        setweight(to_tsvector('english', coalesce("synopsis", '')), 'D') ||
        setweight(to_tsvector('arabic', coalesce("synopsis", '')), 'D') ||
        setweight(to_tsvector('simple', coalesce("synopsis", '')), 'D')
      ));
CREATE UNIQUE INDEX IF NOT EXISTS "unique_library_book" ON "server"."library_books" USING btree ("library_id","book_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_email" ON "server"."user" USING btree ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_username" ON "server"."user" USING btree ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_session_token" ON "server"."user_session" USING btree ("session_token");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_refresh_token" ON "server"."user_session" USING btree ("refresh_token");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "server"."user_session" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "server"."user_session" USING btree ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_password_reset_token" ON "server"."password_reset_token" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_password_reset_user_id" ON "server"."password_reset_token" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_reset_expires_at" ON "server"."password_reset_token" USING btree ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_email_verification_token" ON "server"."email_verification_token" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_email_verification_user_id" ON "server"."email_verification_token" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_email_verification_expires_at" ON "server"."email_verification_token" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_email" ON "server"."login_attempt" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_ip" ON "server"."login_attempt" USING btree ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_attempted_at" ON "server"."login_attempt" USING btree ("attempted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_role_type_name" ON "server"."user_role_type" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_role" ON "server"."user_role" USING btree ("user_id","role_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "server"."user_role" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "server"."user_role" USING btree ("role_id");
CREATE INDEX IF NOT EXISTS "idx_audit_log_user_id" ON "server"."security_audit_log" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_log_action" ON "server"."security_audit_log" USING btree ("action");
CREATE INDEX IF NOT EXISTS "idx_audit_log_timestamp" ON "server"."security_audit_log" USING btree ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_audit_log_severity" ON "server"."security_audit_log" USING btree ("severity");
CREATE INDEX IF NOT EXISTS "idx_account_lockout_user_id" ON "server"."account_lockout" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_account_lockout_locked_until" ON "server"."account_lockout" USING btree ("locked_until");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_oauth_provider_user" ON "server"."oauth_profile" USING btree ("provider","provider_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_oauth_user_provider" ON "server"."oauth_profile" USING btree ("user_id","provider");
CREATE INDEX IF NOT EXISTS "idx_oauth_profile_user_id" ON "server"."oauth_profile" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_oauth_profile_provider" ON "server"."oauth_profile" USING btree ("provider");
CREATE INDEX IF NOT EXISTS "idx_oauth_profile_email" ON "server"."oauth_profile" USING btree ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_author_name" ON "server"."author" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_publisher_name" ON "server"."publisher" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_subject_name" ON "server"."subject" USING btree ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_library_member" ON "server"."library_member" USING btree ("user_id","library_id");
