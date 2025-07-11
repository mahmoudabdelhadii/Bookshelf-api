output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.app.id
}

output "secrets_arn" {
  description = "ARN of the secrets manager secret"
  value       = module.secrets.secret_arn
  sensitive   = true
}