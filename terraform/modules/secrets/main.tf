# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.app_name}-secrets"
  
  tags = {
    Name = "${var.app_name}-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    DATABASE_URL          = var.database_url
    REDIS_URL            = var.redis_url
    JWT_SECRET           = var.jwt_secret
    JWT_REFRESH_SECRET   = var.jwt_refresh_secret
    SESSION_SECRET       = var.session_secret
    EMAIL_USER           = var.email_user
    EMAIL_PASS           = var.email_pass
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    ISBNDB_API_KEY       = var.isbndb_api_key
  })
}

# IAM policy for secrets access
resource "aws_iam_policy" "secrets_policy" {
  name = "${var.app_name}-secrets-policy"

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