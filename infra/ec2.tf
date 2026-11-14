resource "aws_instance" "moon_phases" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.moon_phases.id]

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.instance_volume_size
    delete_on_termination = true
    encrypted             = true
  }

  monitoring                  = var.enable_monitoring
  associate_public_ip_address = var.enable_public_ip

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
  }))

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
  }

  depends_on = [
    aws_security_group.moon_phases
  ]
}

resource "aws_cloudwatch_log_group" "moon_phases" {
  name              = "/${var.environment}/${var.project_name}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}

resource "aws_eip" "moon_phases" {
  instance = aws_instance.moon_phases.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-eip"
  }

  depends_on = [aws_instance.moon_phases]
}
