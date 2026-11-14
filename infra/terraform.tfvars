# Terraform configuration for Moon Phases Staging Environment

aws_region      = "us-east-1"
project_name    = "moon-phases"
environment     = "staging"
instance_type   = "t3.medium"

# Root volume size in GB
instance_volume_size = 30

# Enable CloudWatch detailed monitoring
enable_monitoring = true

# Enable public IP assignment (required for GitHub Actions SSH access)
enable_public_ip = true

# CIDR blocks allowed for SSH access
# GitHub Actions uses dynamic IPs, so we allow all for now
# In production, restrict this to your specific IPs
allowed_ssh_cidrs = ["0.0.0.0/0"]

# Additional tags
tags = {
  Team        = "DevOps"
  CostCenter  = "Engineering"
  Terraform   = "true"
}
