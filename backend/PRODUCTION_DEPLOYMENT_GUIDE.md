# Production Database Deployment Guide

This guide explains how to safely deploy database changes to production using the automated migration system.

## 🚀 Quick Start

### 1. Deploy with Automatic Backup
```bash
cd backend
php deploy.php deploy
```

### 2. Deploy Without Backup (faster, but less safe)
```bash
php deploy.php deploy false
```

### 3. Deploy with Custom Backup Label
```bash
php deploy.php deploy true "v2.1.0_release"
```

## 📋 Step-by-Step Process

### Step 1: Create a Migration
When you need to make database changes:

```bash
# Create a new migration file
php database/migrate.php create add_new_feature_table

# This creates: database/migrations/2025_10_10_123456_add_new_feature_table.sql
```

### Step 2: Edit the Migration File
Edit the generated migration file with your SQL changes:

```sql
-- Migration: add_new_feature_table
-- Created: 2025-10-10 12:34:56

-- Add your migration SQL here
CREATE TABLE IF NOT EXISTS `new_feature` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Step 3: Test Locally
```bash
# Check migration status
php database/migrate.php status

# Run migrations locally
php database/migrate.php migrate
```

### Step 4: Deploy to Production
```bash
# Deploy with automatic backup
php deploy.php deploy

# Or deploy with custom backup label
php deploy.php deploy true "feature_update_$(date +%Y%m%d)"
```

## 🛠️ Available Commands

### Migration Commands
```bash
# Check which migrations have been run
php database/migrate.php status

# Run all pending migrations
php database/migrate.php migrate

# Create a new migration file
php database/migrate.php create <migration_name>
```

### Deployment Commands
```bash
# Deploy with backup (recommended)
php deploy.php deploy

# Deploy without backup (faster)
php deploy.php deploy false

# Create backup only
php deploy.php backup "pre_deployment"

# List available backups
php deploy.php list

# Clean up old backups
php deploy.php cleanup

# Restore from backup (emergency)
php deploy.php restore backup_2024-01-15_12-30-45.sql.gz
```

## 🔒 Safety Features

### Automatic Backups
- Creates timestamped backups before each deployment
- Compresses backups to save space
- Automatic cleanup of old backups (30 days retention)

### Migration Tracking
- Tracks which migrations have been applied
- Prevents duplicate execution
- Maintains execution order

### Rollback Capability
- Easy restore from any backup
- Emergency rollback procedures
- Verification after deployment

## 📊 Migration Best Practices

### ✅ DO:
- Always test migrations locally first
- Use `IF NOT EXISTS` for table creation
- Use `IF EXISTS` for table dropping
- Include rollback SQL in comments
- Keep migrations small and focused
- Use descriptive migration names

### ❌ DON'T:
- Modify existing migration files
- Drop tables without backup
- Make breaking changes without notice
- Skip testing locally
- Deploy without backup in production

## 🔧 Example Migration Patterns

### Adding a New Table
```sql
CREATE TABLE IF NOT EXISTS `new_table` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Adding a Column
```sql
ALTER TABLE `existing_table` 
ADD COLUMN `new_column` VARCHAR(255) DEFAULT NULL 
AFTER `existing_column`;
```

### Adding an Index
```sql
ALTER TABLE `existing_table` 
ADD INDEX `idx_new_column` (`new_column`);
```

### Modifying a Column
```sql
ALTER TABLE `existing_table` 
MODIFY COLUMN `existing_column` VARCHAR(500) NOT NULL;
```

## 🚨 Emergency Procedures

### If Deployment Fails
1. Check the error message
2. Fix the issue in the migration file
3. Restore from backup if necessary:
   ```bash
   php deploy.php restore <latest_backup_file>
   ```
4. Fix and redeploy

### If You Need to Rollback
1. List available backups:
   ```bash
   php deploy.php list
   ```
2. Restore from the desired backup:
   ```bash
   php deploy.php restore backup_2024-01-15_12-30-45.sql.gz
   ```

### If Migration is Stuck
1. Check database connection
2. Verify migration file syntax
3. Check for locked tables
4. Contact database administrator if needed

## 📈 Monitoring and Maintenance

### Regular Tasks
- Clean up old backups monthly
- Monitor migration execution logs
- Verify database integrity after deployments
- Update documentation for schema changes

### Backup Management
```bash
# List all backups
php deploy.php list

# Clean up old backups
php deploy.php cleanup

# Create manual backup
php deploy.php backup "manual_backup_$(date +%Y%m%d)"
```

## 🔍 Troubleshooting

### Common Issues

#### "Migration already exists" Error
- Check if migration was partially applied
- Verify `schema_migrations` table
- Clean up if necessary

#### "Table already exists" Error
- Use `IF NOT EXISTS` in CREATE TABLE statements
- Check for duplicate migration execution

#### Backup Creation Fails
- Verify database credentials
- Check disk space
- Ensure `mysqldump` is available
- Check file permissions

#### Migration Syntax Error
- Test SQL locally first
- Check for missing semicolons
- Verify MySQL version compatibility

## 📞 Support

For issues with the deployment system:
1. Check this guide first
2. Review error logs
3. Test migrations locally
4. Contact the development team

---

**Remember**: Always backup before deploying to production!
