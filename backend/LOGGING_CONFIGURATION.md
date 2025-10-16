# Logging Configuration

## Environment Variables

The ErrorLogger now supports configurable log directory through environment variables.

### LOG_DIR

**Default:** `logs`

**Description:** Specifies the directory where error log files will be stored.

**Examples:**
- `LOG_DIR=logs` (relative to backend directory)
- `LOG_DIR=/var/log/app` (absolute path)
- `LOG_DIR=../shared/logs` (relative path outside backend)

## Configuration

### Development (.env)
```env
# Logging Configuration
LOG_DIR=logs
```

### Production
```env
# Logging Configuration
LOG_DIR=/var/log/your-app
```

## How It Works

1. **Environment Variable Loading**: The backend uses Dotenv to load environment variables from `.env` file
2. **Path Resolution**: 
   - If `LOG_DIR` is relative (doesn't start with `/` or `C:`), it's resolved relative to the backend directory
   - If `LOG_DIR` is absolute, it's used as-is
3. **Directory Creation**: The ErrorLogger automatically creates the log directory if it doesn't exist
4. **Permissions**: Log directory is created with `0755` permissions

## Log File Structure

```
logs/
├── error.log          # Current log file
├── error.log.1        # Rotated log file (1)
├── error.log.2        # Rotated log file (2)
└── ...                # Up to 10 rotated files
```

## Log Rotation

- **Max File Size**: 5MB per log file
- **Max Files**: 10 rotated files (keeps 11 total including current)
- **Rotation**: Automatic when file exceeds size limit

## Production Deployment

For production deployment, consider:

1. **Absolute Path**: Use absolute paths for log directories
2. **Permissions**: Ensure web server has write permissions
3. **Log Rotation**: Consider using system logrotate for additional rotation
4. **Monitoring**: Monitor log directory disk space

### Example Production Configuration

```env
# Production logging configuration
LOG_DIR=/var/log/chokdee-app
```

## Testing

The ErrorLogger can be tested by calling the test endpoints:

```bash
# Test various error types
curl http://localhost:8000/api/error-test/database
curl http://localhost:8000/api/error-test/validation
curl http://localhost:8000/api/error-test/file-system
```

## API Endpoints

- `GET /api/error-logs/recent` - Get recent error logs
- `DELETE /api/error-logs/clear` - Clear all error logs
- `GET /api/error-logs/stats` - Get log statistics

