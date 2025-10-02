# Land Management System - Backend API

A PHP-based REST API for the Land Management System with OAuth 2.0 authentication and role-based access control.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations for users with three roles (system, admin, user)
- **Land Management**: CRUD operations for land records with GeoJSON geometry support
- **Database**: MySQL database with proper indexing and foreign key constraints
- **CORS Support**: Configured for frontend integration

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Composer
- Web server (Apache/Nginx) or PHP built-in server

## Installation

1. **Clone the repository and navigate to the backend directory**
   ```bash
   cd land-management-backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials and JWT secret.

4. **Set up the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Start the development server**
   ```bash
   php -S localhost:8000 -t api
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Users (Admin/System only)

- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Lands

- `GET /api/lands` - Get all lands (all authenticated users)
- `GET /api/lands/{id}` - Get land by ID
- `POST /api/lands` - Create new land (Admin/System only)
- `PUT /api/lands/{id}` - Update land (Admin/System only)
- `DELETE /api/lands/{id}` - Delete land (Admin/System only)

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Default Users

The system comes with pre-configured users:

- **System Admin**: admin@landmanagement.com / password
- **Admin**: admin@example.com / password  
- **User**: user@example.com / password

## Database Schema

### Users Table
- `id` - Primary key
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - Unique email address
- `phone` - Phone number
- `role` - User role (system, admin, user)
- `password_hash` - Hashed password
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Lands Table
- `id` - Primary key
- `land_name` - Name of the land
- `land_code` - Unique land code
- `deed_number` - Deed number
- `location` - Detailed location description
- `province` - Province
- `district` - District
- `city` - City
- `plant_type` - Type of plant/crop
- `category` - Land category
- `plant_year` - Year of planting
- `harvest_cycle` - Harvest cycle in months
- `geometry` - GeoJSON geometry data
- `size` - Area in square meters
- `created_by` - User ID who created the record
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Error Handling

The API returns appropriate HTTP status codes and JSON error messages:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## CORS Configuration

The API is configured to accept requests from `http://localhost:5173` by default. Update the `CORS_ORIGIN` environment variable to match your frontend URL.
