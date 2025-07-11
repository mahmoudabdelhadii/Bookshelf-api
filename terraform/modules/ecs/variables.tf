variable "app_name" {
  description = "Application name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
}

variable "ecs_cpu" {
  description = "ECS task CPU"
  type        = string
}

variable "ecs_memory" {
  description = "ECS task memory"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "secret_arn" {
  description = "ARN of the secrets manager secret"
  type        = string
}

variable "secrets_policy_arn" {
  description = "ARN of the secrets access policy"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}