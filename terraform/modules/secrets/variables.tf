variable "app_name" {
  description = "Application name"
  type        = string
}

variable "database_url" {
  description = "External database URL"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "External Redis URL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret"
  type        = string
  sensitive   = true
}

variable "email_user" {
  description = "Email user"
  type        = string
  sensitive   = true
}

variable "email_pass" {
  description = "Email password"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "isbndb_api_key" {
  description = "ISBNDB API key"
  type        = string
  sensitive   = true
}