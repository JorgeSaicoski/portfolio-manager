# How to Deploy Portfolio Manager to Production

This guide walks you through deploying Portfolio Manager to production **from scratch**, including creating a Vultr account, setting up servers, configuring Authentik, and getting your app live.

**Time required**: 2-3 hours
**Difficulty**: Beginner-friendly
**Cost**: ~$12-24/month (Vultr hosting)

---

## 📋 What & Why

**What you'll accomplish:**
- Create and configure a Vultr server
- Install all required software
- Deploy Portfolio Manager
- Configure authentication with Authentik
- Set up SSL certificates (HTTPS)
- Configure a custom domain
- Verify everything works

**Why it matters:**
- Your app will be accessible on the internet
- Data will be secure with HTTPS
- Users can create accounts and log in
- Production-ready setup following best practices

---

## ✅ Prerequisites

Before starting, you need:

- [ ] **A computer** with terminal access (Mac, Linux, or Windows with WSL)
- [ ] **Git** installed (`git --version`)
- [ ] **SSH** installed (`ssh -V`)
- [ ] **A credit card** (for Vultr - costs ~$12-24/month)
- [ ] **A domain name** (optional but recommended - can buy from Namecheap, GoDaddy, etc. for ~$10/year)
- [ ] **30 minutes of focused time** (don't rush!)

**Local setup:**
```bash
# Verify you have the project
cd /path/to/portfolio-manager
git status  # Should show your repository

# Verify you can run Make commands
make help  # Should show available commands
```

---

## 📝 Step-by-Step Instructions

### Part 1: Create Vultr Account & Server (20 minutes)

#### Step 1.1: Sign Up for Vultr

1. Go to [https://www.vultr.com](https://www.vultr.com)
2. Click **"Sign Up"** in the top right
3. Fill in your details:
   - Email address
   - Password (make it strong!)
   - Click **"Create Account"**
4. Verify your email (check your inbox for Vultr email)
5. Log in to Vultr dashboard

#### Step 1.2: Add Payment Method

1. In Vultr dashboard, click **"Billing"** in left sidebar
2. Click **"Add Payment Method"**
3. Enter your credit card details
4. **Note**: You might get $100-300 free credits for new accounts!

#### Step 1.3: Deploy a Server Instance

1. Click **"Deploy +"** button (blue button, top right)
2. Choose **"Deploy New Server"**

**Configuration:**

| Setting | Choose |
|---------|--------|
| **Choose Server** | Cloud Compute - Shared CPU |
| **CPU & Storage** | Intel Regular Performance |
| **Server Location** | Choose closest to your users (e.g., "New York" for USA) |
| **Server Image** | Ubuntu 22.04 LTS x64 |
| **Server Size** | $12/month: 2 vCPU, 4GB RAM, 80GB SSD (minimum for production) |
| **Additional Features** | ✅ Enable IPv6, ✅ Enable Auto Backups (optional, +$1.20/month) |
| **SSH Keys** | We'll add this in next step |
| **Server Hostname** | `portfolio-production` |
| **Server Label** | `Portfolio Manager Production` |

3. Click **"Deploy Now"**

**Wait 2-3 minutes** for server to deploy. You'll see status change from "Installing" to "Running".

#### Step 1.4: Get Server Details

Once running, click on your server name. Note these details:

```bash
# SAVE THESE - You'll need them!
SERVER_IP: 123.456.789.012  # Your server's IP address
ROOT_PASSWORD: ************  # Shown in Vultr dashboard
```

---

### Part 2: Set Up SSH Access (15 minutes)

#### Step 2.1: Create SSH Key (If You Don't Have One)

On your **local computer**, run:

```bash
# Check if you already have an SSH key
ls ~/.ssh/id_ed25519.pub

# If it exists, skip to Step 2.2
# If not, create one:
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "your_email@example.com"

# Press Enter for no passphrase (or add one for extra security)
# Press Enter again to confirm
```

#### Step 2.2: View Your Public Key

```bash
# Display your public key
cat ~/.ssh/id_ed25519.pub

# Copy this entire output (starts with "ssh-ed25519 ...")
```

#### Step 2.3: Add SSH Key to Vultr

1. In Vultr dashboard, click **"Account"** → **"SSH Keys"**
2. Click **"Add SSH Key"**
3. Paste your public key (from step 2.2)
4. Name it: `my-laptop`
5. Click **"Add SSH Key"**

#### Step 2.4: Add SSH Key to Server

```bash
# SSH to your server (use password from Step 1.4)
ssh root@YOUR_SERVER_IP

# You'll see a warning about authenticity - type "yes" and press Enter
# Enter the root password from Vultr dashboard

# Once logged in, create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
nano ~/.ssh/authorized_keys
# Paste your public key (from Step 2.2)
# Press Ctrl+X, then Y, then Enter to save

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Exit
exit
```

#### Step 2.5: Test SSH Key Authentication

```bash
# Try connecting again (should NOT ask for password now)
ssh root@YOUR_SERVER_IP

# If it works without password, SUCCESS! ✅
# If it asks for password, check the steps above
```

---

### Part 3: Automated Server Setup (10 minutes)

Now we'll use the automated setup script to install everything needed.

#### Step 3.1: Run Setup Script from Your Computer

```bash
# On your LOCAL computer, in the project directory
cd /path/to/portfolio-manager

# Set your server IP
export PRODUCTION_HOST=YOUR_SERVER_IP

# Run the automated setup
make setup-vultr-production PRODUCTION_HOST=$PRODUCTION_HOST
```

This script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Create `deploy` user
- ✅ Configure firewall (UFW)
- ✅ Install security tools (fail2ban)
- ✅ Create deployment directories
- ✅ Configure swap space
- ✅ Apply security hardening

**This takes 5-10 minutes.** You'll see lots of output - that's normal!

#### Step 3.2: Add Deploy User SSH Key

```bash
# Still on your LOCAL computer
# Copy your public key to the deploy user
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@YOUR_SERVER_IP

# Test deploy user access
ssh deploy@YOUR_SERVER_IP

# You should be logged in as 'deploy' user
# Type: whoami
# Output should be: deploy

# Exit
exit
```

---

### Part 4: Deploy the Application (20 minutes)

#### Step 4.1: Clone Repository on Server

```bash
# SSH as deploy user
ssh deploy@YOUR_SERVER_IP

# Navigate to deployment directory
cd /opt/portfolio-manager

# Clone your repository
git clone https://gitea.yourdomain.com/username/portfolio-manager.git .
# OR if using GitHub:
# git clone https://github.com/username/portfolio-manager.git .

# Verify files are there
ls
# You should see: backend, frontend, docker-compose.yml, etc.
```

#### Step 4.2: Configure Environment Variables

```bash
# Still on the server as deploy user
cd /opt/portfolio-manager

# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Edit these important values:**

```bash
# Database (generate strong passwords!)
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD_HERE
AUTHENTIK_SECRET_KEY=GENERATE_RANDOM_50_CHARS_HERE
AUTHENTIK_BOOTSTRAP_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD_HERE

# URLs (use your domain or IP)
DOMAIN=yourdomain.com  # Or YOUR_SERVER_IP if no domain yet
AUTHENTIK_HOST=auth.yourdomain.com  # Or YOUR_SERVER_IP:9000

# Backend
GIN_MODE=release
LOG_LEVEL=info

# Frontend
VITE_API_URL=https://yourdomain.com/api  # Or http://YOUR_SERVER_IP:8000/api
VITE_AUTHENTIK_URL=https://auth.yourdomain.com  # Or http://YOUR_SERVER_IP:9000
```

**Generate secrets:**
```bash
# Generate secret key (50 characters)
openssl rand -base64 50

# Generate another for database
openssl rand -base64 32
```

Press **Ctrl+X**, then **Y**, then **Enter** to save.

#### Step 4.3: Start the Application

```bash
# Still on server
cd /opt/portfolio-manager

# Start all services
docker compose up -d

# This will:
# 1. Download Docker images (first time takes 5-10 minutes)
# 2. Start PostgreSQL database
# 3. Start Redis
# 4. Start Authentik (authentication)
# 5. Start Backend API
# 6. Start Frontend

# Watch the logs
docker compose logs -f

# Press Ctrl+C to stop watching (services keep running)
```

#### Step 4.4: Verify Services Are Running

```bash
# Check service status
docker compose ps

# All services should show "Up" or "healthy"

# Test backend health
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Test frontend
curl http://localhost:3000
# Should return HTML

# Exit back to your local computer
exit
```

---

### Part 5: Configure Authentik (Authentication) (30 minutes)

#### Step 5.1: Access Authentik Admin Panel

1. Open browser: `http://YOUR_SERVER_IP:9000/if/flow/initial-setup/`
2. You'll see Authentik setup screen
3. Set admin password (use a strong one!)
4. Click **"Create Admin"**

#### Step 5.2: Create OAuth2 Provider

1. Log in to Authentik admin panel
2. Click **"Applications"** → **"Providers"** → **"Create"**
3. Choose **"OAuth2/OpenID Provider"**

**Fill in:**
- **Name**: `Portfolio Manager`
- **Authorization flow**: `default-provider-authorization-implicit-consent`
- **Client type**: `Confidential`
- **Client ID**: `portfolio-manager` (exactly this!)
- **Redirect URIs**:
  ```
  http://YOUR_SERVER_IP:3000/auth/callback
  http://localhost:3000/auth/callback
  ```
- **Signing Key**: Select the default certificate

4. Click **"Create"**
5. **IMPORTANT**: Copy the **Client Secret** - you'll need it!

#### Step 5.3: Create Application

1. Click **"Applications"** → **"Applications"** → **"Create"**
2. Fill in:
   - **Name**: `Portfolio Manager`
   - **Slug**: `portfolio-manager`
   - **Provider**: Select "Portfolio Manager" (created in Step 5.2)
   - **Launch URL**: `http://YOUR_SERVER_IP:3000`

3. Click **"Create"**

#### Step 5.4: Update Environment with Client Secret

```bash
# SSH back to server
ssh deploy@YOUR_SERVER_IP

# Edit .env
cd /opt/portfolio-manager
nano .env

# Find this line and update with the Client Secret from Step 5.2:
AUTHENTIK_CLIENT_SECRET=paste_secret_here

# Save (Ctrl+X, Y, Enter)

# Restart services to apply
docker compose restart backend frontend
```

#### Step 5.5: Create User Enrollment Flow

Follow the guide: [docs/authentication/enrollment-setup.md](../authentication/enrollment-setup.md)

Or quick setup:
1. In Authentik admin, go to **Flows & Stages**
2. Click **"Create"** → **"Flow"**
3. Set:
   - **Name**: `User Enrollment`
   - **Title**: `Sign Up`
   - **Slug**: `enrollment`
   - **Designation**: `Enrollment`
4. Add stages (Prompt for email, username, password)
5. Bind flow to OAuth application

---

### Part 6: Set Up Domain & SSL (45 minutes)

#### Step 6.1: Configure Domain DNS

If you have a domain name:

1. Log in to your domain registrar (Namecheap, GoDaddy, etc.)
2. Go to **DNS Settings** or **Manage DNS**
3. Add these A records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |
| A | auth | YOUR_SERVER_IP | 300 |

4. Wait 5-15 minutes for DNS to propagate

**Verify DNS:**
```bash
# On your local computer
dig yourdomain.com +short
# Should return YOUR_SERVER_IP
```

#### Step 6.2: Install Nginx (Reverse Proxy)

```bash
# SSH to server
ssh deploy@YOUR_SERVER_IP

# Install Nginx
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Check nginx is running
sudo systemctl status nginx
```

#### Step 6.3: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/portfolio
```

**Paste this configuration** (replace `yourdomain.com`):

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Authentik
server {
    listen 80;
    server_name auth.yourdomain.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save** (Ctrl+X, Y, Enter)

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Should say "syntax is ok" and "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 6.4: Get SSL Certificates (HTTPS)

```bash
# Get certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d auth.yourdomain.com -d api.yourdomain.com

# Follow prompts:
# 1. Enter your email
# 2. Agree to Terms of Service (Y)
# 3. Share email? (N)
# 4. Redirect HTTP to HTTPS? YES (2)

# Certificates will auto-renew!
```

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
# Should say "Congratulations, all renewals succeeded"
```

#### Step 6.5: Update Application URLs

```bash
# Edit .env with new HTTPS URLs
cd /opt/portfolio-manager
nano .env

# Update these:
DOMAIN=yourdomain.com
AUTHENTIK_HOST=https://auth.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
VITE_AUTHENTIK_URL=https://auth.yourdomain.com

# Save and restart
docker compose restart backend frontend

# Also update frontend .env
nano frontend/.env
# Update URLs to use https://

# Rebuild frontend
docker compose up -d --build frontend
```

#### Step 6.6: Update Authentik Redirect URIs

1. Go to Authentik admin: `https://auth.yourdomain.com`
2. **Applications** → **Providers** → **Portfolio Manager**
3. Edit **Redirect URIs** to:
   ```
   https://yourdomain.com/auth/callback
   https://www.yourdomain.com/auth/callback
   ```
4. Click **Update**

---

### Part 7: Enable Monitoring (15 minutes)

```bash
# On server
cd /opt/portfolio-manager

# Start monitoring stack
docker compose --profile monitoring up -d

# This starts:
# - Prometheus (metrics collection)
# - Grafana (dashboards)
```

**Access Grafana:**
1. Browser: `http://YOUR_SERVER_IP:3001`
2. Login: `admin` / `admin`
3. Change password when prompted
4. Explore pre-configured dashboards!

---

## ✔️ Verification

### Test Everything Works:

#### 1. Frontend Loads
```bash
# Open browser
https://yourdomain.com

# Should see Portfolio Manager homepage
✅ Works!
```

#### 2. Backend Health Check
```bash
curl https://api.yourdomain.com/health
# Should return: {"status":"healthy"}
✅ Works!
```

#### 3. Authentication Flow
1. Go to: `https://yourdomain.com/auth/login`
2. Click "Sign Up"
3. Create an account
4. Verify email (if configured)
5. Log in
6. Should redirect to dashboard

✅ If you can log in and see the dashboard, **EVERYTHING WORKS!**

#### 4. Create Test Portfolio
1. While logged in, click "Portfolios"
2. Click "New Portfolio"
3. Fill in title and description
4. Click "Create"

✅ If portfolio is created, database and backend are working!

---

## 🔧 Troubleshooting

### Problem: Can't SSH to Server

**Error**: `Connection refused` or `Permission denied`

**Solutions**:
```bash
# Check if server is running in Vultr dashboard
# Status should be "Running"

# Check firewall allows SSH
ssh root@YOUR_SERVER_IP
sudo ufw status
# Should show "22/tcp ALLOW"

# If not:
sudo ufw allow 22/tcp
sudo ufw reload
```

### Problem: Services Won't Start

**Error**: `docker compose up` fails

**Solutions**:
```bash
# Check Docker is running
sudo systemctl status docker

# If not running:
sudo systemctl start docker

# Check logs for specific service
docker compose logs backend
docker compose logs frontend

# Common issue: Port already in use
sudo netstat -tlnp | grep :8000
# If something else is using port 8000, stop it or change port
```

### Problem: Can't Access Application

**Error**: Browser shows "Connection refused"

**Solutions**:
```bash
# Check services are running
docker compose ps
# All should show "Up"

# Check firewall allows HTTP/HTTPS
sudo ufw status
# Should show:
# 80/tcp ALLOW
# 443/tcp ALLOW

# If not:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Check Nginx is running
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Problem: Authentication Not Working

**Error**: Login redirects to error page

**Solutions**:
```bash
# Check Authentik is running
docker compose ps portfolio-authentik-server
# Should be "Up"

# Check Authentik logs
docker compose logs portfolio-authentik-server

# Common issues:
# 1. Client secret mismatch - verify in .env matches Authentik
# 2. Redirect URI wrong - must exactly match in Authentik config
# 3. CORS issue - check ALLOWED_ORIGINS in .env includes your domain
```

### Problem: SSL Certificate Failed

**Error**: Certbot can't get certificate

**Solutions**:
```bash
# Check DNS is working
dig yourdomain.com +short
# Should return YOUR_SERVER_IP

# Check port 80 is accessible
curl http://yourdomain.com
# Should get response (even if error page)

# Check firewall
sudo ufw status
# Must allow 80/tcp

# Try manual verification
sudo certbot certonly --manual -d yourdomain.com

# If still fails, check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log
```

### Problem: Frontend Shows "API Connection Failed"

**Error**: Frontend loads but can't connect to API

**Solutions**:
```bash
# Check backend is accessible
curl https://api.yourdomain.com/health

# Check frontend environment variables
cd /opt/portfolio-manager
cat frontend/.env | grep VITE_API_URL
# Should be: VITE_API_URL=https://api.yourdomain.com/api

# Rebuild frontend with correct env
docker compose up -d --build frontend

# Check CORS settings in backend
cat .env | grep ALLOWED_ORIGINS
# Should include your frontend domain
```

---

## ➡️ Next Steps

Congratulations! Your Portfolio Manager is now live in production! 🎉

**What to do next:**

1. **Secure Your Server**:
   - Change default passwords
   - Set up automatic security updates
   - Configure fail2ban (already done by setup script)

2. **Set Up Backups**:
   - Read [How to Backup](./how-to-backup.md)
   - Schedule automatic daily backups
   - Test restore procedure

3. **Configure Monitoring**:
   - Read [How to Monitor](./how-to-monitor.md)
   - Set up alerts in Grafana
   - Configure email notifications

4. **Set Up CI/CD**:
   - Read [CI/CD Setup Guide](../deployment/cicd-setup.md)
   - Automate future deployments
   - Set up staging environment

5. **Customize Your Portfolio**:
   - Read [How to Add a Feature](./how-to-add-a-feature.md)
   - Customize branding and colors
   - Add your projects

6. **Invite Users**:
   - Share your URL: `https://yourdomain.com`
   - Users can self-register
   - Review new user enrollments in Authentik admin

---

## 📚 Related Guides

- [How to Rollback](./how-to-rollback.md) - If something goes wrong
- [How to Backup & Restore](./how-to-backup.md) - Protect your data
- [How to Monitor](./how-to-monitor.md) - Keep an eye on your app
- [How to Investigate Issues](./how-to-investigate.md) - Debug problems
- [CI/CD Setup](../deployment/cicd-setup.md) - Automate deployments

---

## 🎓 What You Learned

- ✅ How to create and configure a Vultr VPS
- ✅ How to set up SSH key authentication
- ✅ How to use Docker Compose for deployment
- ✅ How to configure Authentik for OAuth2 authentication
- ✅ How to set up Nginx as a reverse proxy
- ✅ How to get free SSL certificates with Let's Encrypt
- ✅ How to configure DNS records
- ✅ How to deploy a full-stack application to production
- ✅ How to verify everything works
- ✅ How to troubleshoot common issues

**You're now a deployment pro!** 🚀

---

**Last Updated**: 2025-01-25
**Tested On**: Ubuntu 22.04 LTS, Vultr Cloud Compute
**Author**: Portfolio Manager Team
