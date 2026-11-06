#!/bin/bash

# ECSC Helpdesk Deployment Script
# This script automates the deployment process for production

set -e  # Exit on error

echo "=========================================="
echo "ECSC Helpdesk Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="./backend"
FRONTEND_DIR="."
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR
mkdir -p $BACKEND_DIR/logs

# Check if .env files exist
echo -e "${YELLOW}Checking environment files...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}Error: Backend .env file not found!${NC}"
    echo "Please create $BACKEND_DIR/.env from $BACKEND_DIR/.env.example"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}Error: Frontend .env file not found!${NC}"
    echo "Please create .env from .env.example"
    exit 1
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm ci --production

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate deploy

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
npm run build

cd ..

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm ci --production

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Stop existing PM2 processes
echo -e "${YELLOW}Stopping existing PM2 processes...${NC}"
cd $BACKEND_DIR
pm2 stop ecsc-backend-api 2>/dev/null || true
pm2 delete ecsc-backend-api 2>/dev/null || true

# Start backend with PM2
echo -e "${YELLOW}Starting backend with PM2...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

cd ..

# Restart Nginx
echo -e "${YELLOW}Restarting Nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}=========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}=========================================="
echo ""
echo "Backend API: Running on port 4000 (via PM2)"
echo "Frontend: Running on port 3000 (via Nginx)"
echo ""
echo "Check PM2 status: cd backend && pm2 status"
echo "Check logs: cd backend && pm2 logs"
echo ""
