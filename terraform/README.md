# Terraform Infrastructure for Bookshelf API

This directory contains Terraform configurations for deploying the Bookshelf API to AWS.

## Prerequisites

1. **AWS CLI** - Install and configure with appropriate credentials
2. **Terraform** - Version 1.0 or later
3. **Docker** - For building and pushing container images

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Plan the deployment

```bash
terraform plan
```

### 3. Apply the infrastructure

```bash
terraform apply
```

### 4. Build and push your Docker image

```bash
# Get the ECR repository URL from terraform output
ECR_REPO=$(terraform output -raw ecr_repository_url)

# Build and tag the image
docker build -t $ECR_REPO:latest .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO

# Push the image
docker push $ECR_REPO:latest
```

### 5. Update the ECS service

```bash
aws ecs update-service --cluster bookshelf-api --service bookshelf-api --force-new-deployment
```

## Configuration

### Environment Variables

Set these environment variables for your ECS task:

- `ISBNDB_API_KEY` - Your ISBNDB API key
- `ISBNDB_ENABLED` - Set to `true` to enable ISBNDB integration
- `DATABASE_URL` - Automatically configured by Terraform
- `REDIS_URL` - Configure if using Redis (optional)

### Cost Optimization

This configuration uses:
- **ECS Fargate**: 256 CPU / 512 MB RAM (minimal)
- **RDS t3.micro**: Free tier eligible
- **Application Load Balancer**: Basic configuration
- **CloudWatch**: 7-day log retention

**Estimated monthly cost**: $15-25 USD

## Outputs

After deployment, Terraform will output:
- `load_balancer_dns` - The public URL of your API
- `ecr_repository_url` - ECR repository for Docker images
- `database_endpoint` - RDS database endpoint

## Security Notes

1. **Change default passwords** in the terraform configuration
2. **Use AWS Secrets Manager** for production secrets
3. **Enable SSL/TLS** by adding an SSL certificate to the load balancer
4. **Configure security groups** appropriately for your network

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data in the database.