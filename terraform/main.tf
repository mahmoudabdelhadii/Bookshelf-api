# Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.app_name}-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-sg"
  }
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name = var.app_name
  image_tag_mutability = "MUTABLE"
  
  tags = {
    Name = var.app_name
  }
}

# Secrets Module
module "secrets" {
  source = "./modules/secrets"

  app_name             = var.app_name
  database_url         = var.database_url
  redis_url           = var.redis_url
  jwt_secret          = var.jwt_secret
  jwt_refresh_secret  = var.jwt_refresh_secret
  session_secret      = var.session_secret
  email_user          = var.email_user
  email_pass          = var.email_pass
  google_client_id    = var.google_client_id
  google_client_secret = var.google_client_secret
  isbndb_api_key      = var.isbndb_api_key
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  app_name            = var.app_name
  aws_region          = var.aws_region
  environment         = var.environment
  container_port      = var.container_port
  ecs_cpu            = var.ecs_cpu
  ecs_memory         = var.ecs_memory
  log_retention_days = var.log_retention_days
  ecr_repository_url = aws_ecr_repository.app.repository_url
  secret_arn         = module.secrets.secret_arn
  secrets_policy_arn = module.secrets.secrets_policy_arn
  subnet_ids         = data.aws_subnets.default.ids
  security_group_id  = aws_security_group.app.id
}