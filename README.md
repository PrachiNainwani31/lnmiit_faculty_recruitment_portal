# LNMIIT Faculty Recruitment and Onboarding Portal

A full-stack web application for managing the end-to-end faculty recruitment and onboarding process at The LNM Institute of Information Technology, Jaipur.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Roles and Access](#roles-and-access)
- [Features](#features)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Installation and Setup](#installation-and-setup)
- [Deployment](#deployment)
- [Database](#database)
- [API Overview](#api-overview)

---

## Overview

The portal automates the faculty recruitment lifecycle from candidate shortlisting to onboarding. It supports multiple roles including DoFA, ADoFA, DoFA Office, HoD, Candidate, Establishment, LUCS, Estate, and Registrar Office. Each role has a dedicated portal with role-specific workflows, automated email notifications, and activity logging.

---

## Tech Stack

**Frontend**
- React 18 with Vite
- React Router v6
- Tailwind CSS
- Axios

**Backend**
- Node.js with Express
- Sequelize ORM
- MySQL

**Infrastructure**
- Frontend: Vercel
- Backend: Render
- Database: Railway (MySQL)

---

## Roles and Access

| Role | Description |
|------|-------------|
| DoFA | Dean of Faculty Affairs. Reviews submissions, approves cycles, sets interview dates. |
| ADoFA | Assistant Dean of Faculty Affairs. Same permissions as DoFA. |
| DoFA_OFFICE | Manages candidates, experts, room allotment, registration, and interview coordination. |
| HoD | Head of Department. Uploads candidates and experts, marks appeared candidates, submits cycles. |
| CANDIDATE | Applies via document submission portal, tracks application status. |
| ESTABLISHMENT | Manages offer letters, joining dates, room allotment coordination. |
| LUCS | Handles IT asset provisioning after joining. |
| ESTATE | Manages office/room handover. |
| REGISTRAR_OFFICE | Manages expert travel quotes, tickets, and pickup/drop coordination. |

---

## Features

### Recruitment Cycle Management
- HoDs initiate recruitment cycles per academic year
- Multi-stage status tracking: Draft, Submitted, Query, Approved, Interview Set, Appeared Submitted
- DoFA can raise queries, approve submissions, and set interview dates
- Cycle freeze and close mechanisms

### Candidate Management
- CSV upload of ILSC-shortlisted candidates by HoD
- Template download with pre-filled row count
- Appeared-in-interview marking (gated by interview date)
- Interview invitation emails with auto-generated portal credentials

### Expert Management
- HoD and DoFA can add or upload experts via CSV
- Travel confirmation, quote submission, and ticket upload workflow
- Pickup/drop coordination with driver details
- Quote approval by DoFA with email chain to Registrar Office

### Candidate Application Portal
- Candidates fill a structured application form with document uploads
- Sections: Personal Info, Academic Documents, PhD Documents, Experience, Referees, Publications, Other Documents, Accommodation
- Auto-save every 15 seconds
- Referee invitation via unique portal links with CAPTCHA verification
- Support for resubmission after DoFA query

### Onboarding
- Offer letter and joining letter upload by Establishment
- Room allotment with email notification to Estate
- MIS and library registration tracking
- RFID card upload and dispatch
- LUCS IT asset provisioning
- Joining complete marking with cycle freeze

### User Management
- DoFA Office registers all portal users
- System-generated passwords emailed on registration
- Account deactivation with reactivation email containing new credentials
- Edit and delete user records

### Email Notifications
- Credentials email on registration and reactivation
- Password reset via time-limited token link
- Candidate interview invitations with portal credentials
- Referee invitation and reminder emails with access codes
- Workflow emails at each stage transition (submission, approval, query, joining, etc.)

### Activity Logging
- All user actions are logged with role, entity, and IP address
- Viewable by DoFA and DoFA Office

---

## Project Structure

```
lnmiit_faculty_recruitment/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── api/               # Axios API wrappers
│   │   ├── assets/            # Images and static files
│   │   ├── components/        # Shared UI components and layouts
│   │   ├── pages/             # Role-based page directories
│   │   │   ├── hod/
│   │   │   ├── dofa/
│   │   │   ├── dofa-office/
│   │   │   ├── travel/
│   │   │   ├── candidate/
│   │   │   └── Referee/
│   │   └── App.jsx
│   ├── vercel.json            # SPA routing config for Vercel
│   └── .env
│
└── backend/                   # Node.js + Express API
    ├── config/                # Database and mailer config
    ├── controllers/           # Route handler logic
    ├── middlewares/           # Auth middleware
    ├── models/                # Sequelize model definitions
    ├── routes/                # Express route files
    ├── uploads/               # File upload storage
    ├── utils/                 # Email templates, password generator, logger
    └── server.js
```

---

## Environment Variables

### Backend (.env)

```
PORT=5000
DB_HOST=
DB_NAME=
DB_USER=
DB_PASS=
DB_PORT=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=https://lnmiit-faculty-recruitment-portal.vercel.app/login
NODE_ENV=production
```

### Frontend (.env)

```
VITE_API_URL=[https://your-backend-domain.onrender.com](https://lnmiit-faculty-recruitment-portal.onrender.com)
```

---

## Installation and Setup

### Prerequisites

- Node.js 18 or higher
- MySQL 8

### Backend

```bash
cd backend
npm install
# Configure .env with your database and email credentials
node server.js
```

The server runs on port 5000 by default. On startup, Sequelize runs `sync({ alter: true })` to align the database schema with model definitions.

### Frontend

```bash
cd frontend
npm install
# Configure .env with VITE_API_URL pointing to your backend
npm run dev
```

The development server runs on port 5173 by default.

---

## Deployment

### Frontend (Vercel)

1. Connect the `frontend/` directory to a Vercel project.
2. Set `VITE_API_URL` in Vercel environment variables.
3. Ensure `vercel.json` is present in the frontend root with SPA rewrite rules:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Backend (Render)

1. Connect the `backend/` directory to a Render Web Service.
2. Set all backend environment variables in the Render dashboard.
3. Set the start command to `node server.js`.

### Database (Railway)

1. Create a MySQL service on Railway.
2. Copy the connection credentials into the backend environment variables.
3. The schema is created automatically via Sequelize sync on first startup.

---

## Database

The application uses MySQL with Sequelize ORM. Key tables:

| Table | Description |
|-------|-------------|
| users | All portal users with roles |
| candidates | ILSC-shortlisted candidates uploaded by HoDs |
| candidate_applications | Candidate document submission forms |
| candidate_referees | Referee details per application |
| candidate_experiences | Experience entries per application |
| experts | Expert panel members |
| expert_travels | Travel, quote, and ticket details per expert |
| recruitment_cycles | Per-HoD recruitment cycles with status |
| selected_candidates | Selection outcomes per cycle |
| onboarding_records | Onboarding progress per selected candidate |
| activity_logs | Audit log of all user actions |
| notifications | In-app notifications per role |
| portal_deadlines | Application deadlines per cycle |
| comments | DoFA-HoD communication thread |

---

## API Overview

All API routes are prefixed with `/api`.

| Prefix | Description |
|--------|-------------|
| /api/auth | Login |
| /api/registration | User registration, password reset |
| /api/hod | HoD cycle and dashboard routes |
| /api/candidates | Candidate upload and management |
| /api/experts | Expert management |
| /api/dofa | DoFA dashboard, cycle approval, interview dates |
| /api/dofa-office | DoFA Office dashboard and selection |
| /api/candidate | Candidate application form routes |
| /api/travel | Expert travel and quote management |
| /api/establishment | Onboarding record management |
| /api/estate | Room handover |
| /api/lucs | IT asset management |
| /api/deadline | Portal deadlines |
| /api/comments | DoFA-HoD comment thread |
| /api/activity-logs | Audit log access |
| /api/invite | Interview and expert invitation emails |

---

## Notes

- File uploads are stored in `backend/uploads/` and served as static files.
- JWT tokens are used for authentication. Tokens expire and require re-login.
- `alter: true` sync is used in production. New model columns must also be added manually via `ALTER TABLE` on the Railway database if the service does not restart cleanly.
- The `FRONTEND_URL` environment variable must include the `https://` protocol prefix and must not have a trailing slash.
