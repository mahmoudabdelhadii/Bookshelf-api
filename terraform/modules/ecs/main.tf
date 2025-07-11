# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = var.app_name
  
  tags = {
    Name = var.app_name
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = var.log_retention_days
  
  tags = {
    Name = "${var.app_name}-logs"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "secrets_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = var.secrets_policy_arn
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = var.app_name
      image = "${var.ecr_repository_url}:latest"
      
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      
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
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.secret_arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${var.secret_arn}:REDIS_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.secret_arn}:JWT_SECRET::"
        },
        {
          name      = "JWT_REFRESH_SECRET"
          valueFrom = "${var.secret_arn}:JWT_REFRESH_SECRET::"
        },
        {
          name      = "SESSION_SECRET"
          valueFrom = "${var.secret_arn}:SESSION_SECRET::"
        },
        {
          name      = "EMAIL_USER"
          valueFrom = "${var.secret_arn}:EMAIL_USER::"
        },
        {
          name      = "EMAIL_PASS"
          valueFrom = "${var.secret_arn}:EMAIL_PASS::"
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = "${var.secret_arn}:GOOGLE_CLIENT_ID::"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "${var.secret_arn}:GOOGLE_CLIENT_SECRET::"
        },
        {
          name      = "ISBNDB_API_KEY"
          valueFrom = "${var.secret_arn}:ISBNDB_API_KEY::"
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
    }
  ])

  tags = {
    Name = "${var.app_name}-task-definition"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = var.app_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = true
  }

  tags = {
    Name = "${var.app_name}-service"
  }
}