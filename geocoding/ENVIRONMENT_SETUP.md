# Environment Variable Setup

## Debug Logging Control

To enable or disable debug console logs, create a `.env` file in the `geocoding` directory:

### Steps:

1. Create `.env` file in `geocoding` directory:
```bash
cd geocoding
touch .env
```

2. Add this line to enable debug logs:
```env
VITE_ENABLE_DEBUG_LOGS=true
```

3. Or add this line to disable debug logs (default):
```env
VITE_ENABLE_DEBUG_LOGS=false
```

4. Restart your development server:
```bash
npm run dev
```

## Notes

- **Default**: Debug logs are disabled (silent mode)
- You must restart the dev server after changing the environment variable
- In production builds, console logs are automatically removed regardless of this setting

## Usage in Code

The debug logger has been integrated into key files:
- `my-form-dialog-load.tsx` - Edit land dialog
- `Dashboard.tsx` - Land conversion debugging

See `DEBUG_LOGGING.md` for detailed documentation.



