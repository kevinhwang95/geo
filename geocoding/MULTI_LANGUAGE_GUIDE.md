# Multi-Language Support Guide

This application now supports multiple languages using react-i18next. Currently supports English and Thai.

## How to Add a New Language

### 1. Create Translation File
Create a new JSON file in `src/i18n/locales/` with your language code (e.g., `fr.json` for French):

```json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès",
    // ... add all translations
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    // ... add all translations
  },
  "navigation": {
    "dashboard": "Tableau de bord",
    "map": "Carte",
    // ... add all translations
  }
}
```

### 2. Update i18n Configuration
Edit `src/i18n/index.ts` to include your new language:

```typescript
// Import translation files
import enTranslations from './locales/en.json';
import thTranslations from './locales/th.json';
import frTranslations from './locales/fr.json'; // Add this

const resources = {
  en: {
    translation: enTranslations,
  },
  th: {
    translation: thTranslations,
  },
  fr: { // Add this
    translation: frTranslations,
  },
};
```

### 3. Update Language Switcher
Edit `src/components/core/LanguageSwitcher.tsx` to include your new language:

```typescript
const languages = [
  { code: 'en', name: t('language.english'), flag: '🇺🇸' },
  { code: 'th', name: t('language.thai'), flag: '🇹🇭' },
  { code: 'fr', name: t('language.french'), flag: '🇫🇷' }, // Add this
];
```

### 4. Add Language Labels
Add the language name to both `en.json` and `th.json` files:

```json
{
  "language": {
    "switchTo": "Switch to",
    "english": "English",
    "thai": "ไทย",
    "french": "Français" // Add this
  }
}
```

## Usage in Components

### Basic Translation
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <p>{t('auth.loginError')}</p>
    </div>
  );
};
```

### Translation with Variables
```typescript
// In translation file
{
  "welcome": "Welcome, {{name}}!"
}

// In component
<h1>{t('welcome', { name: user.name })}</h1>
```

### Pluralization
```typescript
// In translation file
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In component
<p>{t('items', { count: itemCount })}</p>
```

## Translation Keys Structure

The translation keys are organized by feature/component:

- `common.*` - Common UI elements (buttons, labels, etc.)
- `auth.*` - Authentication related text (login, register, forms)
- `navigation.*` - Navigation menu items including:
  - `navigation.dashboard` - Dashboard menu item
  - `navigation.map` - Map menu item
  - `navigation.notifications` - Notifications menu item
  - `navigation.lands` - Lands menu item
  - `navigation.users` - Users menu item
  - `navigation.teams` - Teams menu item
  - `navigation.workAssignments` - Work Assignments menu item
  - `navigation.reports` - Reports menu item
  - `navigation.settings` - Settings menu item
  - `navigation.profile` - Profile menu item
  - `navigation.help` - Help menu item
  - `navigation.menu.*` - Menu UI elements (loading, open menu, navigation title)
  - `navigation.admin.*` - Admin dropdown menu items
- `pages.*` - Page titles and descriptions
- `language.*` - Language switcher labels
- `landing.*` - Landing page content including:
  - `landing.title` - Main system title
  - `landing.tagline` - System description
  - `landing.logoAlt` - Logo alt text
  - `landing.features.*` - Feature descriptions
  - `landing.badges.*` - Feature highlight badges
  - `landing.terms.*` - Terms of service text
- `forgotPassword.*` - Forgot password modal content
- `dashboard.*` - Dashboard content including:
  - `dashboard.header.*` - Header elements (logo, notifications, logout)
  - `dashboard.stats.*` - Statistics cards (total lands, harvest due, etc.)
  - `dashboard.recentLands.*` - Recent lands section
  - `dashboard.lands.*` - All lands section with search and filters
  - `dashboard.harvestStatus.*` - Harvest status labels
  - `dashboard.errors.*` - Error messages
  - `dashboard.loading.*` - Loading states

## Best Practices

1. **Keep keys descriptive**: Use `auth.loginError` instead of `error1`
2. **Group by feature**: Organize translations by component or feature
3. **Use consistent naming**: Follow camelCase for keys
4. **Test all languages**: Ensure UI doesn't break with longer/shorter text
5. **Handle missing translations**: i18next will fall back to the key if translation is missing

## Current Supported Languages

- English (en) - Default
- Thai (th) - ไทย

## Comprehensive Coverage

The multi-language implementation covers all aspects of the login page:

### ✅ Landing Page Content
- **Main Title**: "Land Management System" / "ระบบจัดการที่ดิน"
- **Tagline**: Full system description with feature highlights
- **Logo Alt Text**: Accessible alternative text
- **Feature Cards**: All 5 feature descriptions translated
- **Feature Badges**: Interactive mapping, role-based access, real-time collaboration
- **Terms of Service**: Complete legal text with proper context

### ✅ Authentication Forms
- **Login Form**: All labels, placeholders, and buttons
- **Registration Form**: All fields and validation messages
- **Forgot Password Modal**: Complete modal with success/error states
- **Form Validation**: All error messages and success notifications

### ✅ Dashboard Content
- **Header Section**: Logo alt text, notifications tooltip, logout button
- **Statistics Cards**: All 5 stat cards with titles and descriptions
  - Total Lands / ที่ดินทั้งหมด
  - Harvest Due / ใกล้เก็บเกี่ยว  
  - Overdue / เกินกำหนด
  - Unread Notifications / การแจ้งเตือนที่ยังไม่ได้อ่าน
  - High Priority / ความสำคัญสูง
- **Recent Lands Section**: Title, description, view tooltips
- **All Lands Section**: Search placeholder, loading states, error messages
- **Land Cards**: View tooltips, status labels, action buttons
- **Empty States**: No lands messages and search results

### ✅ Navigation & UI
- **Navigation Menu**: Complete translation system for all menu items
  - **Dynamic Menu Items**: Database-driven menus with translation mapping
  - **Static Menu Items**: Dashboard, Map, Notifications, Lands, Users, Teams, etc.
  - **Admin Dropdown**: User Management / จัดการผู้ใช้, Menu Management / จัดการเมนู
  - **Menu UI Elements**: Loading states, open menu tooltips, navigation titles
- **Global Language Switcher**: Fixed position in top-right corner (standard UX pattern)
- **Language Switcher Features**: 
  - Beautiful dropdown with flag emojis (🇺🇸 🇹🇭)
  - Shows current language with checkmark
  - Appears on ALL pages with fixed positioning
  - Responsive design (shows flags on mobile, full names on desktop)
- **Error Pages**: 404, unauthorized, and other system pages

### ✅ Interactive Elements
- **Buttons**: All button text with loading states
- **Alerts**: Success and error messages
- **Tooltips**: Help text and descriptions
- **Form States**: Loading, disabled, and interactive states

## Language Detection

The application automatically detects the user's language preference from:
1. Local storage (if previously set)
2. Browser language settings
3. Falls back to English

Users can manually switch languages using the global language switcher in the top-right corner.

## UX Improvements

### 🎯 **Standard User Behavior**
- **Fixed Position**: Language switcher is always visible in the top-right corner
- **Global Access**: Available on every page without scrolling
- **High Z-Index**: Floats above all content (z-50)
- **Consistent Location**: Follows standard web application patterns

### 🎨 **Visual Design**
- **Backdrop Blur**: Semi-transparent background with blur effect
- **Shadow Effects**: Subtle shadows that respond to hover
- **Flag Icons**: Visual language indicators for quick recognition
- **Responsive**: Adapts to screen size (full names on desktop, flags on mobile)

### ⚡ **Performance**
- **Fixed Positioning**: No layout shifts when switching languages
- **Instant Switching**: Language changes without page reload
- **Memory Efficient**: Single component instance across all pages
- **No Horizontal Overflow**: Responsive design prevents horizontal scroll bars

### 🛠️ **Technical Solutions**
- **Viewport Constraints**: `max-w-[calc(100vw-2rem)]` ensures component fits within viewport
- **Flexible Layout**: `flex-shrink-0` and `truncate` classes prevent text overflow
- **Global CSS**: `overflow-x: hidden` on html/body prevents horizontal scrolling
- **Responsive Gaps**: Smaller gaps on mobile (`gap-1`) vs desktop (`gap-2`)
