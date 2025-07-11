# AWS Secrets Manager for sensitive environment variables
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.app_name}-secrets"
  description = "Application secrets for ${var.app_name}"

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-secrets"
  })
}

# Secret version with application secrets
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    # JWT Configuration
    JWT_SECRET         = var.jwt_secret
    JWT_REFRESH_SECRET = var.jwt_refresh_secret
    
    # Session Configuration
    SESSION_SECRET = var.session_secret
    
    # Database Configuration (using external Neon database)
    DATABASE_URL = var.database_url
    
    # Redis Configuration (using external Redis or local fallback)
    REDIS_URL = var.redis_url
    
    # Email Configuration (optional)
    EMAIL_USER = var.email_user
    EMAIL_PASS = var.email_pass
    
    # OAuth Configuration (optional)
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    APPLE_CLIENT_ID      = var.apple_client_id
    APPLE_TEAM_ID        = var.apple_team_id
    APPLE_KEY_ID         = var.apple_key_id
    APPLE_PRIVATE_KEY    = var.apple_private_key
    
    # External APIs (optional)
    ISBNDB_API_KEY = var.isbndb_api_key
  })
}

# IAM policy for ECS tasks to access secrets
resource "aws_iam_policy" "ecs_secrets_policy" {
  name        = "${var.app_name}-ecs-secrets-policy"
  description = "IAM policy for ECS tasks to access secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.app_secrets.arn
      }
    ]
  })
}

# Attach secrets policy to ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_secrets_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_secrets_policy.arn
}