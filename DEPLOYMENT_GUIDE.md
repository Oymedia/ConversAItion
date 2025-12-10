# On-Premise Deployment Guide: ConversAItion

This guide will help you deploy the ConversAItion application on your own server.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 5 GB | 10 GB |
| OS | Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+ | Ubuntu 22.04 LTS |

---

## Step 1: Install Node.js

### On Ubuntu/Debian:
```bash
# Update package index
sudo apt update

# Install curl if not present
sudo apt install -y curl

# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### On CentOS/RHEL:
```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Install Node.js
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### On Windows:
1. Download Node.js 20 LTS from: https://nodejs.org/
2. Run the installer and follow the prompts
3. Open Command Prompt and verify: `node --version`

---

## Step 2: Install PostgreSQL (Optional)

The application can run with in-memory storage (data resets on restart) or PostgreSQL (persistent data).

### For persistent data, install PostgreSQL:

### On Ubuntu/Debian:
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER conversaition WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE conversaition OWNER conversaition;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE conversaition TO conversaition;"

# Verify connection
psql -h localhost -U conversaition -d conversaition -c "SELECT 1;"
```

### On Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run installer, set password for postgres user
3. Use pgAdmin to create a new database called `conversaition`

---

## Step 3: Download the Application

### Option A: From Replit (Recommended)
1. In your Replit workspace, click the three dots menu
2. Select "Download as zip"
3. Transfer the zip file to your server
4. Extract: `unzip your-project.zip -d /opt/conversaition`

### Option B: Using Git (if you have a repository)
```bash
cd /opt
git clone <your-repository-url> conversaition
cd conversaition
```

---

## Step 4: Install Dependencies

```bash
# Navigate to project directory
cd /opt/conversaition

# Install all dependencies
npm install

# Build the application for production
npm run build
```

---

## Step 5: Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano /opt/conversaition/.env
```

Add the following content:

```env
# Required: Your OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required: Session secret (generate a random string)
SESSION_SECRET=your-random-secret-string-at-least-32-characters

# Server configuration
NODE_ENV=production
PORT=5000

# Database (only if using PostgreSQL)
DATABASE_URL=postgresql://conversaition:your_secure_password@localhost:5432/conversaition
PGHOST=localhost
PGPORT=5432
PGUSER=conversaition
PGPASSWORD=your_secure_password
PGDATABASE=conversaition
```

### Generate a secure SESSION_SECRET:
```bash
# On Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6: Initialize Database (if using PostgreSQL)

```bash
cd /opt/conversaition

# Push database schema
npm run db:push
```

---

## Step 7: Run the Application

### For Testing:
```bash
npm run start
```

The application will be available at: http://your-server-ip:5000

### For Production (using PM2):

PM2 is a process manager that keeps your app running and restarts it if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
cd /opt/conversaition
pm2 start dist/index.js --name conversaition

# Save PM2 configuration to restart on reboot
pm2 save
pm2 startup
# Run the command that PM2 outputs

# View logs
pm2 logs conversaition

# Check status
pm2 status
```

---

## Step 8: Set Up Reverse Proxy (Recommended)

Use Nginx to serve your app on port 80/443.

### Install Nginx:
```bash
sudo apt install -y nginx
```

### Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/conversaition
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or your server IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/conversaition /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9: Set Up SSL (Optional but Recommended)

Use Let's Encrypt for free SSL certificates:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Start app | `pm2 start conversaition` |
| Stop app | `pm2 stop conversaition` |
| Restart app | `pm2 restart conversaition` |
| View logs | `pm2 logs conversaition` |
| Check status | `pm2 status` |

---

## Troubleshooting

### Port already in use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill the process
sudo kill -9 <PID>
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U conversaition -d conversaition
```

### Application won't start
```bash
# Check logs
pm2 logs conversaition --lines 100

# Check environment variables are loaded
cat /opt/conversaition/.env
```

### OpenAI API errors
- Verify your API key is correct
- Check you have API credits in your OpenAI account
- Ensure your server can reach api.openai.com

---

## Firewall Configuration

Allow necessary ports:

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Only if not using Nginx

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Stopping the Application After 1 Week

To completely stop the application:

```bash
# Stop the application
pm2 stop conversaition

# Delete from PM2 (optional - completely remove)
pm2 delete conversaition

# Stop PostgreSQL if not needed
sudo systemctl stop postgresql
```

---

## Support

If you encounter issues:
1. Check the application logs: `pm2 logs conversaition`
2. Verify environment variables are set correctly
3. Ensure all required ports are open
4. Check that PostgreSQL is running (if using database)
