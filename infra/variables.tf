variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "moon-phases"
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "instance_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "enable_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access (GitHub Actions)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Change this to your GitHub Actions IP for better security
}

variable "enable_public_ip" {
  description = "Enable public IP assignment"
  type        = bool
  default     = true
}
