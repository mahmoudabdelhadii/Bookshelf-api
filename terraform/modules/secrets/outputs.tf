output "secret_arn" {
  description = "ARN of the secrets manager secret"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = aws_iam_policy.secrets_policy.arn
}