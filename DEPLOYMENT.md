# ECSC Helpdesk - Production Deployment Guide

This guide provides step-by-step instructions for deploying the ECSC Helpdesk application to a production server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [SSL/HTTPS Configuration](#sslhttps-configuration)
6. [Application Deployment](#application-deployment)
7. [Nginx Configuration](#nginx-configuration)
8. [Process Management (PM2)](#process-management-pm2)
9. [Database Backups](#database-backups)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Security Checklist](#security-checklist)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04 LTS or later (recommended)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 50GB, recommended 100GB+
- **CPU**: Minimum 2 cores, recommended 4+ cores

### Software Requirements

- Node.js 18.x or later
- npm 9.x or later
- PostgreSQL 15
- Nginx
- PM2
- Docker (optional, for database)
- Git

## Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 3. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PM2

```bash
sudo npm install -g pm2
pm2 startup
```

### 6. Install Docker (Optional)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 7. Clone Repository

```bash
cd /var/www
sudo git clone <your-repository-url> ecsc-helpdesk
cd ecsc-helpdesk
sudo chown -R $USER:$USER .
```

## Environment Configuration

### 1. Backend Environment Variables

Copy the example file and configure:

```bash
cd backend
cp .env.example .env
nano .env
```

**Required variables to update:**

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD@localhost:5432/ecsc_helpdesk?schema=public"

# JWT Configuration
JWT_SECRET="YOUR_SUPER_SECURE_RANDOM_SECRET_KEY_MINIMUM_32_CHARACTERS"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=4000
NODE_ENV=production

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_email_password"
SMTP_FROM="noreply@yourdomain.com"
```

### 2. Frontend Environment Variables

```bash
cd ..
cp .env.example .env
nano .env
```

**Required variables to update:**

```bash
# Backend API URL (Production)
NEXT_PUBLIC_BACKEND_URL="https://api.yourdomain.com"

# Application Environment
NODE_ENV="production"
```

## Database Setup

### Option 1: Using Docker Compose (Recommended)

```bash
# Create .env file for docker-compose
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=ecsc_helpdesk
POSTGRES_PORT=5432
EOF

# Start database
docker-compose up -d

# Check status
docker-compose ps
```

### Option 2: Native PostgreSQL

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE ecsc_helpdesk;
CREATE USER ecsc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ecsc_helpdesk TO ecsc_user;
\q
```

### Run Migrations

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

## SSL/HTTPS Configuration

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Auto-renewal

Certbot automatically sets up auto-renewal. Verify:

```bash
sudo certbot renew --dry-run
```

## Application Deployment

### 1. Install Dependencies

```bash
# Backend
cd backend
npm ci --production

# Frontend
cd ..
npm ci --production
```

### 2. Build Applications

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ..
npm run build
```

### 3. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
# Backend
cd backend
pm2 start ecosystem.config.js --env production
pm2 save

# Frontend (Next.js)
pm2 start npm --name "ecsc-frontend" -- start
pm2 save
```

## Nginx Configuration

### 1. Copy Nginx Configuration

```bash
sudo cp nginx.conf /etc/nginx/sites-available/ecsc-helpdesk
```

### 2. Update Domain Name

```bash
sudo nano /etc/nginx/sites-available/ecsc-helpdesk
```

Replace `yourdomain.com` with your actual domain.

### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ecsc-helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Process Management (PM2)

### Start Applications

```bash
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Common PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart ecsc-backend-api

# Stop application
pm2 stop ecsc-backend-api

# Monitor
pm2 monit
```

## Database Backups

### 1. Setup Backup Script

```bash
chmod +x backup-database.sh
```

### 2. Schedule with Cron

```bash
crontab -e
```

Add this line for daily backups at 2 AM:

```
0 2 * * * /var/www/ecsc-helpdesk/backup-database.sh >> /var/www/ecsc-helpdesk/backups/backup.log 2>&1
```

### 3. Manual Backup

```bash
./backup-database.sh
```

### 4. Restore from Backup

```bash
gunzip backups/ecsc_helpdesk_backup_YYYYMMDD_HHMMSS.sql.gz
psql -U postgres -d ecsc_helpdesk < backups/ecsc_helpdesk_backup_YYYYMMDD_HHMMSS.sql
```

## Monitoring and Logging

### Application Logs

```bash
# PM2 logs
cd backend
pm2 logs

# Winston logs
tail -f backend/logs/combined-$(date +%Y-%m-%d).log
tail -f backend/logs/error-$(date +%Y-%m-%d).log
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/ecsc-helpdesk-access.log

# Error logs
sudo tail -f /var/log/nginx/ecsc-helpdesk-error.log
```

### System Logs

```bash
journalctl -u nginx -f
journalctl -u postgresql -f
```

## Security Checklist

### ✅ Pre-Deployment

- [ ] Change all default passwords
- [ ] Set strong JWT secret (minimum 32 characters)
- [ ] Configure CORS for production domains only
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (UFW)
- [ ] Disable root SSH login
- [ ] Set up fail2ban
- [ ] Configure database backups
- [ ] Review and update security headers
- [ ] Remove development dependencies

### ✅ Post-Deployment

- [ ] Test all critical functionality
- [ ] Verify SSL certificate is valid
- [ ] Check database connections
- [ ] Test file uploads
- [ ] Verify email sending (if configured)
- [ ] Monitor error logs
- [ ] Set up monitoring alerts
- [ ] Document backup restore process

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (if needed)
sudo ufw allow 5432/tcp

# Check status
sudo ufw status
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs

# Check port availability
sudo netstat -tlnp | grep :4000
sudo netstat -tlnp | grep :3000

# Check environment variables
pm2 env 0
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U postgres -d ecsc_helpdesk -c "SELECT 1"

# Check Prisma schema
cd backend
npx prisma studio
```

### Nginx 502 Bad Gateway

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify backend is running
pm2 status

# Check upstream configuration
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Restart Nginx
sudo systemctl reload nginx
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear backend cache
cd backend
rm -rf dist
npm run build
```

## Performance Optimization

### 1. Enable Gzip Compression

Already configured in nginx.conf.

### 2. Enable Caching

Configure CDN for static assets.

### 3. Database Connection Pooling

Adjust in Prisma schema or connection string.

### 4. PM2 Cluster Mode

Already configured in ecosystem.config.js.

## Maintenance

### Weekly Tasks

- Review error logs
- Check disk space
- Verify backups
- Update dependencies (carefully)

### Monthly Tasks

- Review security updates
- Test backup restoration
- Review performance metrics
- Update SSL certificates (auto-renewed but verify)

## Support

For issues or questions:
- Check logs in `backend/logs/`
- Review Nginx logs
- Check PM2 status
- Review this troubleshooting guide

## Additional Resources

- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [NestJS Production Guide](https://docs.nestjs.com/faq/production)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
