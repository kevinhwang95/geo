# Production Database Update Guide

## 🚨 **CRITICAL: READ THIS ENTIRE GUIDE BEFORE PROCEEDING**

This guide will help you safely update your production database to include the new email template management system and other missing features.

## 📋 **Pre-Update Checklist**

### ✅ **Before You Start:**

1. **Backup Your Database** (REQUIRED)
   ```bash
   mysqldump -h your_host -u your_user -p your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on Staging Environment**
   - Run the update script on a copy of your production data
   - Verify all functionality works correctly
   - Test email template features

3. **Schedule Maintenance Window**
   - Plan for 15-30 minutes of downtime
   - Notify users if necessary
   - Have rollback plan ready

4. **Verify Prerequisites**
   - MySQL/MariaDB version 5.7+ or 10.2+
   - Sufficient disk space (backup + update)
   - Database user has ALTER, CREATE, INSERT privileges

## 🔧 **Update Process**

### **Method 1: Using the Migration System (Recommended)**

```bash
# 1. Copy the migration file to your production server
scp backend/database/migrations/006_production_sync_missing_tables.sql user@production:/path/to/migrations/

# 2. Run the migration
cd /path/to/your/backend
php database/migrate.php migrate

# 3. Verify the update
php database/migrate.php status
```

### **Method 2: Direct SQL Execution**

```bash
# 1. Connect to your production database
mysql -h your_host -u your_user -p your_database

# 2. Execute the update script
source /path/to/production_update.sql;

# 3. Verify tables were created
SHOW TABLES LIKE '%email%';
SHOW TABLES LIKE '%notification%';
```

### **Method 3: Using the Deployment Script**

```bash
# 1. Copy deployment files to production
scp backend/deploy.php user@production:/path/to/backend/
scp backend/database/migrate.php user@production:/path/to/backend/database/

# 2. Run deployment with backup
php deploy.php deploy true "production_update_$(date +%Y%m%d)"

# 3. Verify deployment
php deploy.php list
```

## 📊 **What This Update Adds**

### **New Tables:**
- `email_templates` - Dynamic email template management
- `notification_logs` - Audit trail for sent notifications
- `schema_migrations` - Migration tracking system

### **New Columns:**
- `users.language_code` - User language preference
- `lands.plant_year` - Year when plants were planted
- `lands.harvest_cycle` - Harvest cycle in days
- `lands.palm_area` - Area used for palm growing
- `lands.area_rai` - Area in Thai rai units
- `lands.area_ngan` - Area in Thai ngan units
- `lands.area_tarangwa` - Area in Thai tarangwa units

### **New Data:**
- Default email templates (English & Thai)
- Migration tracking records
- Updated land records with plant_year

## ✅ **Post-Update Verification**

### **1. Verify Tables Exist:**
```sql
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('email_templates', 'notification_logs', 'schema_migrations');
```

### **2. Verify Email Templates:**
```sql
SELECT template_key, language_code, is_active 
FROM email_templates 
ORDER BY template_key, language_code;
```

### **3. Verify New Columns:**
```sql
SELECT COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'language_code';

SELECT COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'lands' 
AND COLUMN_NAME IN ('plant_year', 'harvest_cycle', 'palm_area');
```

### **4. Test Email Template Features:**
- Login to admin panel
- Navigate to Email Templates section
- Verify templates are displayed
- Test creating/editing templates
- Test sending release notifications

## 🚨 **Rollback Plan**

If something goes wrong, here's how to rollback:

### **Quick Rollback:**
```bash
# Restore from backup
mysql -h your_host -u your_user -p your_database < backup_YYYYMMDD_HHMMSS.sql
```

### **Partial Rollback (if only some tables were created):**
```sql
-- Remove new tables
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS schema_migrations;

-- Remove new columns (if they were added)
ALTER TABLE users DROP COLUMN IF EXISTS language_code;
ALTER TABLE lands DROP COLUMN IF EXISTS plant_year;
ALTER TABLE lands DROP COLUMN IF EXISTS harvest_cycle;
ALTER TABLE lands DROP COLUMN IF EXISTS palm_area;
ALTER TABLE lands DROP COLUMN IF EXISTS area_rai;
ALTER TABLE lands DROP COLUMN IF EXISTS area_ngan;
ALTER TABLE lands DROP COLUMN IF EXISTS area_tarangwa;
```

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **"Table already exists" Error:**
- This is normal - the script uses `CREATE TABLE IF NOT EXISTS`
- Check if the table structure is correct

#### **"Column already exists" Error:**
- This is normal - the script uses `ADD COLUMN IF NOT EXISTS`
- Check if the columns were added correctly

#### **"Access denied" Error:**
- Ensure your database user has CREATE, ALTER, INSERT privileges
- Contact your database administrator

#### **"JSON function not supported" Error:**
- Your MySQL version might be too old
- Minimum required: MySQL 5.7.8 or MariaDB 10.2.7
- Consider upgrading your database

### **Performance Issues:**
- The update adds several indexes which might slow down the process
- For large databases, consider running during off-peak hours
- Monitor database performance during and after the update

## 📞 **Support**

If you encounter issues:

1. **Check the logs:**
   ```bash
   tail -f /var/log/mysql/error.log
   ```

2. **Verify database status:**
   ```sql
   SHOW PROCESSLIST;
   SHOW ENGINE INNODB STATUS;
   ```

3. **Contact support with:**
   - Error messages
   - Database version
   - Backup file location
   - Steps taken before the error

## 📈 **Next Steps After Update**

1. **Update Application Code:**
   - Deploy the latest frontend and backend code
   - Ensure all new features are available

2. **Configure Email Settings:**
   - Set up Resend API key
   - Test email functionality
   - Configure SMTP if needed

3. **Train Users:**
   - Show admin users how to use email templates
   - Demonstrate release notification features
   - Update user documentation

4. **Monitor Performance:**
   - Check database performance
   - Monitor email sending
   - Review error logs

## ✅ **Success Criteria**

The update is successful when:

- [ ] All new tables are created
- [ ] All new columns are added
- [ ] Email templates are populated
- [ ] Admin can access Email Templates menu
- [ ] Email sending works correctly
- [ ] Release notifications can be sent
- [ ] No errors in application logs
- [ ] All existing functionality still works

---

**Remember:** Always test on staging first and have a rollback plan ready!
