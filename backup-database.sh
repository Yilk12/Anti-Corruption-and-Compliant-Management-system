#!/bin/bash

# ECSC Helpdesk Database Backup Script
# This script creates automated backups of the PostgreSQL database
# Schedule with cron: 0 2 * * * /path/to/backup-database.sh

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ecsc_helpdesk_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Database credentials (from environment)
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-ecsc_helpdesk}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD}

echo "=========================================="
echo "Database Backup Script"
echo "=========================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup file: $BACKUP_FILE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Remove old backups (older than RETENTION_DAYS)
echo "Removing backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "ecsc_helpdesk_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)

echo "=========================================="
echo "Backup completed successfully!"
echo "=========================================="
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo "Size: $BACKUP_SIZE"
echo "Retention: $RETENTION_DAYS days"
echo ""

# Optional: Upload to cloud storage (uncomment and configure)
# aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://your-bucket/backups/
