# NyayEase Backend

The backend server for the NyayEase application, a digital e-portal for case management and online legal hearings in India.

## Features

- RESTful API built with Express.js
- MongoDB database integration
- JWT-based authentication
- Role-based access control (Litigant, Advocate, Court Officer)
- Document upload and management
- Case filing and tracking
- Hearing management
- Notification system

## Setup

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB installed locally or MongoDB Atlas account

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the backend directory with the following environment variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nyayease
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

### Running the Server

For development:
```
npm run dev
```

For production:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (Court Officers only)
- `GET /api/users/advocates` - Get all advocates (with optional filters)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Cases
- `GET /api/cases` - Get all cases (filtered by user role)
- `POST /api/cases` - Create a new case (Litigants only)
- `GET /api/cases/:id` - Get case by ID
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case (Court Officers only)
- `PUT /api/cases/:id/advocates` - Assign advocate to case
- `DELETE /api/cases/:id/advocates/:advocateId` - Remove advocate from case

### Documents
- `GET /api/cases/:caseId/documents` - Get all documents for a case
- `POST /api/cases/:caseId/documents` - Upload document to a case
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Hearings
- `GET /api/hearings` - Get all hearings
- `POST /api/hearings` - Create a new hearing (Court Officers only)
- `GET /api/hearings/:id` - Get hearing by ID
- `PUT /api/hearings/:id` - Update hearing (Court Officers only)
- `DELETE /api/hearings/:id` - Delete hearing (Court Officers only)

## Database Models

- User - Stores all user types (Litigant, Advocate, Court Officer)
- Case - Legal case details and status
- Document - Files associated with cases
- Hearing - Court hearing details
- Notification - User notifications

## Authentication & Authorization

The API uses JWT (JSON Web Tokens) for authentication. Certain routes are restricted based on user roles:
- `litigant` - Regular users who file cases
- `advocate` - Legal representatives
- `court-officer` - Judges and court administrators 