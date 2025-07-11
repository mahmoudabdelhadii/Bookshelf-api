variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "bookshelf-api"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "database_url" {
  description = "External database URL (Neon PostgreSQL)"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "External Redis URL (optional - can be empty for local fallback)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ecs_cpu" {
  description = "ECS task CPU"
  type        = string
  default     = "256"
}

variable "ecs_memory" {
  description = "ECS task memory"
  type        = string
  default     = "512"
}

variable "ecs_desired_count" {
  description = "ECS service desired count"
  type        = number
  default     = 1
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "bookshelf-api"
    Environment = "development"
    ManagedBy   = "terraform"
  }
}

# Secret variables
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh secret key"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret key"
  type        = string
  sensitive   = true
}

variable "email_user" {
  description = "Email service username"
  type        = string
  sensitive   = true
  default     = ""
}

variable "email_pass" {
  description = "Email service password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_client_id" {
  description = "Apple OAuth client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_team_id" {
  description = "Apple OAuth team ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_key_id" {
  description = "Apple OAuth key ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "apple_private_key" {
  description = "Apple OAuth private key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "isbndb_api_key" {
  description = "ISBNDB API key"
  type        = string
  sensitive   = true
  default     = ""
}