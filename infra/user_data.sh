#!/bin/bash
set -e

PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
AWS_REGION="${aws_region}"

# Update system
apt-get update
apt-get upgrade -y

# Install dependencies
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  jq \
  awscli \
  ca-certificates \
  gnupg \
  lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose (standalone)
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/$PROJECT_NAME
cd /opt/$PROJECT_NAME

# Create pg_password file (will be overwritten by deployment)
echo "changeme" > pg_password.txt
chmod 600 pg_password.txt

# Create docker-compose template
cat > /opt/$PROJECT_NAME/docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16.3-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=moonuser
      - POSTGRES_DB=moonphases_db
      - POSTGRES_PASSWORD_FILE=/run/secrets/pg_password
    secrets:
      - pg_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - private
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U moonuser -d moonphases_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    image: placeholder-backend:latest
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=moonuser
      - DB_NAME=moonphases_db
      - DB_PASSWORD_FILE=/run/secrets/pg_password
    secrets:
      - pg_password
    networks:
      - public
      - private
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: placeholder-frontend:latest
    restart: unless-stopped
    ports:
      - "80:8080"
    networks:
      - public
    depends_on:
      - backend

secrets:
  pg_password:
    file: ./pg_password.txt

volumes:
  postgres-data:

networks:
  public:
  private:
    internal: true
COMPOSE_EOF

# Configure CloudWatch agent
cat > /opt/$PROJECT_NAME/cloudwatch-config.json << 'CW_EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "/$ENVIRONMENT/$PROJECT_NAME/docker",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
CW_EOF

# Enable Docker service
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# CloudWatch Logs Agent setup
aws configure set region $AWS_REGION

# Create systemd service for docker-compose
cat > /etc/systemd/system/moon-phases.service << 'SERVICE_EOF'
[Unit]
Description=Moon Phases Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/moon-phases
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable moon-phases

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
echo "Docker and dependencies installed successfully" >> /var/log/user-data.log
