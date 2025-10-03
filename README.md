# Land Management System - Enhanced with OAuth 2.0

A comprehensive land management system with interactive mapping, role-based access control, and collaborative features.

## 🚀 Features

### Authentication & Authorization
- **OAuth 2.0 Integration** with Google
- **Role-based Access Control** (Admin, Contributor, User)
- **JWT Token Management** with refresh tokens
- **Protected API Endpoints** with bearer token authentication

### Land Management
- **Interactive Mapping** with Google Maps and TerraDraw
- **Land Registration** with polygon drawing
- **Plant Type Management** (Admin only)
- **Category Management** (Admin only)
- **Harvest Cycle Tracking** with automatic notifications

### Collaboration Features
- **Comments & Notes** system for lands
- **Photo Attachments** with GPS coordinates
- **Real-time Notifications** for harvest cycles
- **Dashboard** with comprehensive overview

### User Management
- **User Registration** and role assignment (Admin)
- **Profile Management** with avatar support
- **Activity Tracking** and audit logs

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** for components
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Google Maps API** for mapping
- **TerraDraw** for drawing tools

### Backend
- **PHP 8.0+** with PSR-4 autoloading
- **MySQL** database
- **JWT** for authentication
- **OAuth 2.0** with Google
- **RESTful API** design
- **CORS** support

## 📋 Prerequisites

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Node.js 18 or higher
- Composer
- Google Cloud Console account (for OAuth)

## 🔧 Installation

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geo/backend
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DB_HOST=localhost
   DB_NAME=land_management
   DB_USER=your_username
   DB_PASS=your_password
   JWT_SECRET=your_jwt_secret_key
   JWT_ALGORITHM=HS256
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/oauth/google/callback
   CORS_ORIGIN=http://localhost:5173
   UPLOAD_DIR=/path/to/uploads/photos/
   ```

4. **Setup database**
   ```bash
   mysql -u root -p < database/enhanced_schema.sql
   ```

5. **Start PHP server**
   ```bash
   php -S localhost:8000 -t api/
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../geocoding
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔐 Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable Google+ API
   - Enable Google Maps JavaScript API

3. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:8000/api/oauth/google/callback`
     - `http://localhost:5173/auth/google/callback`

4. **Get API Keys**
   - Create API key for Google Maps
   - Restrict API key to your domains

## 📊 Database Schema

The system uses an enhanced database schema with the following main tables:

- **users** - User accounts with OAuth support
- **plant_types** - Plant type definitions (Admin managed)
- **categories** - Land categories (Admin managed)
- **lands** - Land parcels with geometry
- **land_comments** - Comments and notes
- **land_photos** - Photo attachments with GPS
- **notifications** - System notifications
- **oauth_tokens** - Refresh token management

## 🎯 User Roles & Permissions

### Admin
- Manage plant types and categories
- Register and manage users
- Register and manage lands
- View all data and analytics
- Manage system settings

### Contributor
- Register and manage lands
- Add comments and photos
- View assigned lands
- Manage harvest notifications

### User
- View lands and comments
- Add comments and photos
- View notifications
- Basic dashboard access

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Traditional login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh token

### OAuth
- `GET /api/oauth/google-url` - Get Google OAuth URL
- `POST /api/oauth/google` - Handle Google OAuth callback
- `POST /api/oauth/refresh` - Refresh OAuth token
- `POST /api/oauth/logout` - OAuth logout

### Lands
- `GET /api/lands` - List all lands
- `POST /api/lands` - Create new land
- `GET /api/lands/{id}` - Get land details
- `PUT /api/lands/{id}` - Update land
- `DELETE /api/lands/{id}` - Delete land

### Plant Types (Admin)
- `GET /api/plant-types` - List plant types
- `POST /api/plant-types` - Create plant type
- `PUT /api/plant-types/{id}` - Update plant type
- `DELETE /api/plant-types/{id}` - Delete plant type

### Categories (Admin)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Comments
- `GET /api/comments` - List comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### Photos
- `POST /api/photos/upload` - Upload photo
- `GET /api/photos/{id}` - Get photo details
- `DELETE /api/photos/{id}` - Delete photo

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/mark-read/{id}` - Mark as read
- `POST /api/notifications/dismiss/{id}` - Dismiss notification

## 🔄 Development Workflow

1. **Backend Development**
   - Modify PHP controllers in `backend/src/controllers/`
   - Update database schema in `backend/database/`
   - Test API endpoints with Postman or similar

2. **Frontend Development**
   - Modify React components in `geocoding/src/components/`
   - Update state management in `geocoding/src/stores/`
   - Test with hot reload on `http://localhost:5173`

3. **Database Changes**
   - Update schema in `backend/database/enhanced_schema.sql`
   - Run migrations manually
   - Update API endpoints as needed

## 🧪 Testing

### Backend Testing
```bash
cd backend
composer test  # If PHPUnit is configured
```

### Frontend Testing
```bash
cd geocoding
npm test
```

## 📦 Deployment

### Backend Deployment
1. Upload PHP files to web server
2. Configure Apache/Nginx virtual host
3. Set up SSL certificate
4. Configure environment variables
5. Run database migrations

### Frontend Deployment
```bash
cd geocoding
npm run build
# Upload dist/ folder to web server
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Mobile app with React Native
- [ ] Real-time collaboration features
- [ ] Advanced analytics and reporting
- [ ] Integration with IoT sensors
- [ ] Machine learning for crop prediction
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Export/Import functionality
- [ ] API rate limiting and caching
- [ ] Automated testing suite