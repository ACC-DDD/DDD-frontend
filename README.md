# Disaster Detection Frontend

A Next.js frontend application for the disaster detection system that connects to a backend API for real-time monitoring and user management.

## Features

- **User Authentication**: Login, signup, logout, and token management
- **Profile Management**: View and update user profiles
- **CCTV Monitoring**: Real-time CCTV feed monitoring with disaster detection
- **Location-based Services**: District and city-based filtering
- **Responsive Design**: Mobile-friendly interface

## Backend API Integration

This frontend connects to the following backend API endpoints:

### Member APIs
- `POST /members/auth/login` - User login
- `POST /members/auth/signup` - User registration
- `POST /members/me/logout` - User logout
- `POST /members/auth/reissue` - Token refresh
- `GET /members/me` - Get user profile
- `PATCH /members/me` - Update user profile
- `PATCH /members/me/password` - Change password
- `GET /members/{id}` - Get member by ID
- `DELETE /members/{id}` - Delete member
- `GET /members/search` - Search members by address

### CCTV APIs
- `GET /cctvs` - Get all CCTVs
- `POST /cctvs` - Create/update CCTV
- `POST /cctvs/table` - Create CCTV table
- `DELETE /cctvs/table` - Delete CCTV table
- `POST /cctvs/import-csv` - Import CCTV data from CSV
- `GET /cctvs/{id}` - Get CCTV by ID
- `DELETE /cctvs/{id}` - Delete CCTV
- `GET /cctvs/{id}/stream` - Get CCTV stream URL
- `GET /cctvs/districts` - Get all districts
- `POST /cctvs/export` - Export CCTV data to CSV

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd disaster-detection-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the environment variables in `.env.local`:
   ```env
   # Backend API Configuration
   API_BASE_URL=http://your-backend-url:8080
   NEXT_PUBLIC_API_BASE_URL=http://your-backend-url:8080
   
   # Firebase Configuration (if needed)
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── admin/                 # Admin panel for CCTV management
├── components/            # Reusable UI components
├── contexts/              # React contexts (AuthContext)
├── hooks/                 # Custom React hooks (useAuth)
├── services/              # API service layer (direct backend connection)
├── utils/                 # Utility functions (auth management)
├── login/                 # Login page
├── signup/                # Signup page
├── profile/               # Profile management page
└── disaster-simulation/   # Disaster simulation page
```

## Key Components

### API Service Layer (`app/services/api.ts`)
Centralized API client that handles all backend communication with proper error handling and authentication.

### Authentication Manager (`app/utils/auth.ts`)
Manages JWT tokens, user data, and authentication state with automatic token refresh.

### Auth Context (`app/contexts/AuthContext.tsx`)
React context provider that makes authentication state available throughout the app.

### Custom Hooks
- `useAuth` - Authentication state management
- `useToast` - Toast notifications

## Authentication Flow

1. User logs in with phone number and password
2. Backend returns access and refresh tokens
3. Tokens are stored in localStorage
4. API requests include Authorization header
5. Automatic token refresh on expiration
6. Logout clears all stored data

## CCTV Integration

The application fetches CCTV data from the backend and displays:
- Real-time camera feeds
- Disaster detection status
- Location-based filtering
- Interactive map interface

## Development Notes

- The app uses Next.js 14 with App Router
- UI components are built with shadcn/ui
- Map functionality uses Leaflet
- Authentication uses JWT tokens
- All API calls go through the service layer for consistency

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables
3. Deploy to your preferred hosting platform
4. Ensure backend API is accessible from the frontend domain

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows requests from frontend domain
2. **Token Expiration**: Check token refresh logic and backend token validity
3. **API Connection**: Verify `API_BASE_URL` environment variable
4. **Map Not Loading**: Check Leaflet CSS import and component mounting

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Update this README for new features