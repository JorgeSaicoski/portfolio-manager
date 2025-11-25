#!/bin/bash
set -e

# Vultr Server Setup Script
# This script sets up a fresh Vultr Ubuntu server for hosting Portfolio Manager

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Vultr Server Setup for Portfolio Manager${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Get environment
ENVIRONMENT="${1:-staging}"
echo -e "Setting up for: ${YELLOW}${ENVIRONMENT}${NC}"
echo ""

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    vim \
    ca-certificates \
    gnupg \
    lsb-release
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi
echo ""

# Create deploy user
echo -e "${YELLOW}👤 Creating deploy user...${NC}"
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    echo -e "${GREEN}✓ Deploy user created${NC}"
else
    echo -e "${GREEN}✓ Deploy user already exists${NC}"
fi

# Set up SSH for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo -e "${YELLOW}📝 Add your SSH public key to /home/deploy/.ssh/authorized_keys${NC}"
echo ""

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Backend API
ufw allow 9000/tcp  # Authentik
ufw allow 3000/tcp  # Frontend (if needed)
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Configure fail2ban
echo -e "${YELLOW}🛡️  Configuring fail2ban...${NC}"
systemctl start fail2ban
systemctl enable fail2ban
echo -e "${GREEN}✓ Fail2ban configured${NC}"
echo ""

# Create deployment directories
echo -e "${YELLOW}📁 Creating deployment directories...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_PATH="/opt/portfolio-manager"
else
    DEPLOY_PATH="/opt/portfolio-manager-staging"
fi

mkdir -p "$DEPLOY_PATH"
mkdir -p /opt/backups/portfolio-manager
chown -R deploy:deploy "$DEPLOY_PATH"
chown -R deploy:deploy /opt/backups/portfolio-manager
echo -e "${GREEN}✓ Directories created at ${DEPLOY_PATH}${NC}"
echo ""

# Install Gitea Actions Runner (optional)
echo -e "${YELLOW}🏃 Setting up Gitea Actions Runner...${NC}"
read -p "Install Gitea Actions Runner? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Download runner
    cd /opt
    wget -O gitea-runner https://dl.gitea.com/act_runner/0.2.6/act_runner-0.2.6-linux-amd64
    chmod +x gitea-runner

    # Create runner directory
    mkdir -p /opt/gitea-runner
    mv gitea-runner /opt/gitea-runner/
    chown -R deploy:deploy /opt/gitea-runner

    echo -e "${GREEN}✓ Gitea runner downloaded${NC}"
    echo ""
    echo -e "${YELLOW}To register the runner:${NC}"
    echo "1. Get registration token from your Gitea instance"
    echo "2. Run: sudo -u deploy /opt/gitea-runner/gitea-runner register"
    echo "3. Create systemd service to run the runner"
    echo ""
fi

# Setup swap (for low memory VMs)
echo -e "${YELLOW}💾 Setting up swap space...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✓ 2GB swap created${NC}"
else
    echo -e "${GREEN}✓ Swap already exists${NC}"
fi
echo ""

# Configure Docker logging
echo -e "${YELLOW}📝 Configuring Docker logging...${NC}"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker
echo -e "${GREEN}✓ Docker logging configured${NC}"
echo ""

# Install monitoring tools
echo -e "${YELLOW}📊 Installing monitoring tools...${NC}"
apt-get install -y nethogs iotop
echo -e "${GREEN}✓ Monitoring tools installed${NC}"
echo ""

# Security hardening
echo -e "${YELLOW}🔒 Applying security hardening...${NC}"

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Set up automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo -e "${GREEN}✓ Security hardening applied${NC}"
echo ""

# Setup completion
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Server Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
echo "2. Clone the repository to ${DEPLOY_PATH}"
echo "3. Copy .env.example to .env and configure variables"
echo "4. Run: make setup"
echo "5. Configure SSL/TLS certificates (Let's Encrypt)"
echo ""
echo -e "${YELLOW}Deployment commands:${NC}"
echo "- Deploy: ./scripts/deploy.sh ${ENVIRONMENT}"
echo "- View logs: docker compose logs -f"
echo "- Backup: make db-backup"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "- Grafana: http://$(hostname -I | awk '{print $1}'):3001"
echo "- Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo ""
