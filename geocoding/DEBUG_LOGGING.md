# Debug Logging Configuration

This project uses a conditional debug logging system controlled by an environment variable.

## Setup

1. Create a `.env` or `.env.local` file in the `geocoding` directory:
```env
# Debug Logging
VITE_ENABLE_DEBUG_LOGS=false
```

2. Set the value to control logging:
   - `VITE_ENABLE_DEBUG_LOGS=true` - Enable debug console logs
   - `VITE_ENABLE_DEBUG_LOGS=false` - Disable debug console logs (default)

## Default Behavior

- **Default**: `false` - All debug logs are disabled (silent)
- This is the production-friendly setting

## Usage in Code

Import and use the debug logger:

```typescript
import { debugLog, debugError, debugWarn, debugInfo } from '@/utils/debugLogger';

// Log a message
debugLog('This will only show if VITE_ENABLE_DEBUG_LOGS=true');

// Log an error
debugError('An error occurred:', error);

// Log a warning
debugWarn('A warning:', warning);

// Log info
debugInfo('Some info:', data);
```

## Advanced Usage

Create a logger with a prefix:

```typescript
import { createDebugLogger } from '@/utils/debugLogger';

const logger = createDebugLogger('ComponentName');

logger.log('Message 1'); // Will log: [ComponentName] Message 1
logger.error('Error');   // Will log: [ComponentName] Error
```

## Environment Files

The following files are checked in order (first wins):
1. `.env.local` (local overrides)
2. `.env` (project defaults)

Add `.env` and `.env.local` to `.gitignore` if they contain sensitive data.

## Production Build

In production builds, console logs are automatically removed by the build process regardless of this setting.

## Development

During development, you can toggle debug logs by:
1. Changing `VITE_ENABLE_DEBUG_LOGS` in your `.env` file
2. Restarting the dev server



