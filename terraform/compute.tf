# ECR Repository
resource "aws_ecr_repository" "app" {
  name = var.app_name
  
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-ecr"
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.app_name

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-cluster"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-logs"
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = var.app_name
      image = "${aws_ecr_repository.app.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      
      # Environment variables (non-sensitive)
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "HOST"
          value = "0.0.0.0"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]
      
      # Secrets from AWS Secrets Manager
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "SESSION_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SESSION_SECRET::"
        },
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:REDIS_URL::"
        },
        {
          name      = "EMAIL_USER"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:EMAIL_USER::"
        },
        {
          name      = "EMAIL_PASS"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:EMAIL_PASS::"
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:GOOGLE_CLIENT_ID::"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:GOOGLE_CLIENT_SECRET::"
        },
        {
          name      = "ISBNDB_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:ISBNDB_API_KEY::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}${var.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-task-definition"
  })
}

# ECS Service (no load balancer - direct public access)
resource "aws_ecs_service" "app" {
  name            = var.app_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-service"
  })
}