# Database Migration Guide

This guide explains the new migration system based on the production database schema.

## Overview

The migration system has been completely restructured to use the production database as the seed. All previous migration files have been removed and replaced with two comprehensive migrations:

1. **001_production_schema_seed.sql** - Creates the base schema from production
2. **002_development_enhancements.sql** - Adds development-specific features

## Migration Files

### 001_production_schema_seed.sql
This migration creates the core database schema based on the production backup (`u671899480_chokdeegeo-10092025.sql`). It includes:

- All core tables (users, lands, categories, plant_types, etc.)
- All foreign key relationships
- All indexes and constraints
- Views (v_dashboard_notifications, v_lands_detailed)
- Basic work_assignments table

### 002_development_enhancements.sql
This migration adds features that exist in development but not in production:

- `email_templates` table with multi-language support
- `email_template_translations` table
- `notification_logs` table
- `schema_migrations` table for migration tracking
- `supported_languages` table
- Additional columns for existing tables:
  - `translation_key` columns for categories and plant_types
  - `palm_area` column for lands table
  - Updated `size` precision in lands table
- Default email templates (English and Thai)
- Default supported languages

## Schema Differences Between Production and Development

### Tables Missing in Production
- `email_templates`
- `email_template_translations` 
- `notification_logs`
- `schema_migrations`
- `supported_languages`

### Tables Missing in Development
- `v_dashboard_notifications` (view)
- `v_lands_detailed` (view)

### Column Differences
- **categories**: Development has `translation_key` column
- **plant_types**: Development has `translation_key` column  
- **lands**: Development has `palm_area` column and different `size` precision (15,3 vs 15,2)
- Various columns have different DEFAULT NULL handling between environments

## How to Apply Migrations

### For Fresh Installation
```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE land_management;"

# 2. Apply the base production schema
mysql -u root -p land_management < database/migrations/001_production_schema_seed.sql

# 3. Apply development enhancements
mysql -u root -p land_management < database/migrations/002_development_enhancements.sql
```

### For Existing Development Database
If you have an existing development database that you want to sync with production:

```bash
# 1. Backup your current database
mysqldump -u root -p land_management > backup_before_migration.sql

# 2. Drop and recreate the database (WARNING: This will delete all data)
mysql -u root -p -e "DROP DATABASE land_management; CREATE DATABASE land_management;"

# 3. Apply the migrations
mysql -u root -p land_management < database/migrations/001_production_schema_seed.sql
mysql -u root -p land_management < database/migrations/002_development_enhancements.sql
```

### Using the Migration Script
You can also use the provided PHP migration script:

```bash
cd backend
php database/migrate.php
```

## Migration Tracking

The `schema_migrations` table tracks which migrations have been applied:

```sql
SELECT * FROM schema_migrations ORDER BY batch, id;
```

## Key Features Added in Development

### Email Templates
- Multi-language email template support
- Template variables system
- Base template and translation system
- Default templates for password setup and reset in English and Thai

### Notification Logs
- Audit trail for sent notifications
- Success/failure tracking
- JSON details storage

### Language Support
- Supported languages table
- Translation key system for categories and plant types
- Thai language support with proper Unicode handling

### Enhanced Land Management
- Palm area calculations for Thai agriculture
- More precise area measurements (decimal 15,3)
- Tree count tracking

## Database Connection

The system uses the following environment variables for database connection:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=land_management
DB_USER=root
DB_PASS=
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Ensure migrations are run in order
   - Check that referenced tables exist before creating foreign keys

2. **View Creation Errors**
   - Views depend on the underlying tables
   - Ensure all base tables are created before creating views

3. **Character Set Issues**
   - The schema uses `utf8mb4` for full Unicode support
   - Ensure your MySQL server supports utf8mb4

### Verification

After applying migrations, verify the schema:

```sql
-- Check all tables exist
SHOW TABLES;

-- Check migration tracking
SELECT * FROM schema_migrations;

-- Verify foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'land_management' 
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Future Migrations

For future database changes:

1. Create new migration files with sequential numbering (003_, 004_, etc.)
2. Include both schema changes and data migrations
3. Update the `schema_migrations` table
4. Test migrations on a copy of the production database first

## Production Deployment

When deploying to production:

1. Test migrations on a staging environment first
2. Backup the production database before applying migrations
3. Apply migrations during maintenance windows
4. Verify application functionality after migration

## Support

If you encounter issues with the migration system:

1. Check the error logs
2. Verify database permissions
3. Ensure MySQL version compatibility
4. Review the migration files for syntax errors


