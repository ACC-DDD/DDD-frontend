# Terraform configuration for deploying Next.js frontend to AWS S3 + CloudFront

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "bucket_name" {
  description = "S3 bucket name for frontend"
  type        = string
  default     = "ddd-acc-next-frontend"
}

variable "cloudfront_distribution_id" {
  description = "Existing CloudFront distribution ID"
  type        = string
  default     = "your-cloudfront-distribution-id"
}

variable "backend_api_url" {
  description = "Backend API URL"
  type        = string
  default     = "https://your-backend-api-url.com"
}

# Data source to get existing S3 bucket
data "aws_s3_bucket" "frontend_bucket" {
  bucket = var.bucket_name
}

# Data source to get existing CloudFront distribution
data "aws_cloudfront_distribution" "frontend_distribution" {
  id = var.cloudfront_distribution_id
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = data.aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${data.aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = data.aws_cloudfront_distribution.frontend_distribution.arn
          }
        }
      }
    ]
  })
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "frontend_bucket_pab" {
  bucket = data.aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "frontend_bucket_website" {
  bucket = data.aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

# Local exec to build and deploy the frontend
resource "null_resource" "build_and_deploy" {
  triggers = {
    # Trigger rebuild when source files change
    source_hash = filemd5("${path.module}/../package.json")
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      echo "Building Next.js application..."
      npm run export
      echo "Deploying to S3..."
      aws s3 sync out/ s3://${var.bucket_name} --delete --region ${var.aws_region}
      echo "Invalidating CloudFront cache..."
      aws cloudfront create-invalidation --distribution-id ${var.cloudfront_distribution_id} --paths "/*"
    EOT

    environment = {
      NEXT_PUBLIC_API_BASE_URL = var.backend_api_url
      API_BASE_URL            = var.backend_api_url
    }
  }

  depends_on = [
    aws_s3_bucket_policy.frontend_bucket_policy,
    aws_s3_bucket_website_configuration.frontend_bucket_website
  ]
}

# Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = data.aws_s3_bucket.frontend_bucket.id
}

output "s3_bucket_website_endpoint" {
  description = "Website endpoint of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend_bucket_website.website_endpoint
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = data.aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = data.aws_cloudfront_distribution.frontend_distribution.domain_name
}