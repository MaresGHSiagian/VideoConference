# Video Conference Application

Video Conference application with WebRTC support built using Laravel backend, Next.js frontend, and Node.js signaling server.

## Project Structure

```
├── backend/           # Laravel API Backend
├── frontend/          # Next.js Frontend
└── signaling-server/  # Node.js WebRTC Signaling Server
```

## Features

- **User Authentication**: Register, login, and password reset functionality
- **Video Conferencing**: Real-time video and audio communication using WebRTC
- **Room Management**: Create and join meeting rooms
- **Chat System**: Real-time messaging during video calls
- **Responsive Design**: Works on desktop and mobile devices
- **Laravel API**: RESTful API with Swagger documentation

## Technologies Used

### Backend (Laravel)
- Laravel 11
- MySQL/SQLite Database
- Laravel Sanctum for API authentication
- Swagger API Documentation
- Laravel Notifications for email

### Frontend (Next.js)
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- WebRTC for video/audio communication
- Socket.IO for real-time communication

### Signaling Server (Node.js)
- Node.js with Socket.IO
- WebRTC signaling for peer connections
- Real-time messaging

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PHP (v8.1 or higher)
- Composer
- MySQL or SQLite

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install PHP dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Configure database in `.env` file

6. Run migrations:
```bash
php artisan migrate
```

7. Start Laravel server:
```bash
php artisan serve
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`

5. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Signaling Server Setup

1. Navigate to signaling server directory:
```bash
cd signaling-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the signaling server:
```bash
npm start
```

The signaling server will be available at `http://localhost:3001`

## API Documentation

Once the backend is running, you can access the Swagger API documentation at:
`http://localhost:8000/api/documentation`

## Environment Variables

### Backend (.env)
```
APP_NAME=VideoConference
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database.sqlite

FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
```

## Usage

1. Start all three servers (backend, frontend, signaling server)
2. Open `http://localhost:3000` in your browser
3. Register a new account or login
4. Create a new room or join existing room
5. Allow camera and microphone permissions
6. Start video conferencing!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Contact

For any questions or support, please contact marespdd@gmail.com.
