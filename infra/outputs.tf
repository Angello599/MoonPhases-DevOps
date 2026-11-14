output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.moon_phases.id
}

output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_eip.moon_phases.public_ip
}

output "ec2_public_dns" {
  description = "EC2 instance public DNS"
  value       = aws_instance.moon_phases.public_dns
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.moon_phases.id
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.moon_phases.name
}

output "deployment_info" {
  description = "Deployment information summary"
  value = {
    environment          = var.environment
    region               = var.aws_region
    instance_type        = var.instance_type
    instance_id          = aws_instance.moon_phases.id
    instance_public_ip   = aws_eip.moon_phases.public_ip
    backend_registry     = aws_ecr_repository.backend.repository_url
    frontend_registry    = aws_ecr_repository.frontend.repository_url
    ssh_command          = "ssh -i ~/.ssh/your-key.pem ubuntu@${aws_eip.moon_phases.public_ip}"
  }
}
