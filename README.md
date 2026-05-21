---

# Campix – Campus Issue Management System

Campix is a web-based campus issue and complaint management system developed as a 4th semester mini project. The platform helps students report campus-related problems digitally and allows administrators to manage and resolve them efficiently.

The project focuses on improving communication between students and different campus departments through a centralized complaint management platform.

---

## - Features

* User registration and login using JWT authentication
* Role-based access for students and admins
* Complaint submission and tracking system
* Real-time notifications using Socket.io
* Admin dashboard for managing complaints
* Complaint status updates and monitoring
* File/image upload support for complaints
* Responsive UI for desktop and mobile devices

---

## - Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer
- **Environment**: dotenv

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React, Heroicons

---

## - Project Structure

```bash
campix-campus-issue-management-system/
├── server/                    # Backend application
│   ├── config/               # Configuration files (DB connection)
│   ├── controllers/          # Request handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── sockets/             # Socket.io event handlers
│   ├── uploads/             # User-uploaded files
│   ├── scripts/             # Utility scripts
│   ├── utils/               # Helper functions
│   ├── .env                 # Environment variables
│   ├── package.json         # Backend dependencies
│   └── server.js            # Entry point
│
└── client/                   # Frontend application
    ├── src/                 # React source code
    ├── public/              # Static assets
    ├── dist/                # Production build
    ├── index.html           # HTML entry point
    ├── vite.config.js       # Vite configuration
    ├── eslint.config.js     # ESLint configuration
    ├── package.json         # Frontend dependencies
    └── tailwind.config.js   # Tailwind CSS configuration
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js
* MongoDB
* npm

---

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the server folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campix
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key
```

Run the backend server:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

##  Main API Routes

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Complaints

```http
GET    /api/complaints
POST   /api/complaints
PUT    /api/complaints/:id
DELETE /api/complaints/:id
```

### Users

```http
GET /api/users/profile
PUT /api/users/profile
GET /api/users/my-complaints
```

### Notifications

```http
GET /api/notifications
PUT /api/notifications/:id/read
```

---

## - Future Improvements

* GPS system
* Reward Based System for Engagement
* Mobile application version

---

## - Project Objective

The main objective of Campix is to simplify the process of reporting and resolving campus issues by providing a centralized digital platform for students and administrators.

---

## - Developed As

4th Semester Academic Mini Project

---

## - License

This project is developed for academic and learning purposes.

---

