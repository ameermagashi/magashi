# Magashi IT Help Desk

Internal ticket management system for reporting and resolving IT problems.

## Stack

- **Frontend:** React (Vite) + React Router
- **Backend:** Express.js REST API
- **Database:** MySQL
- **Auth:** JWT + bcrypt password hashing

## Features

- User registration and login (Staff / IT Officer)
- Staff create tickets (title, category, description, priority)
- Categories: Software, Hardware, Network, Other
- Staff see only their own tickets; IT Officers see all
- Status workflow: Open → In Progress → Resolved
- IT Officers can add comments and resolution notes
- Dashboard counts: total, open, in progress, resolved
- Search and filter by status, priority, or category
- Relational schema: users ↔ tickets ↔ comments

## Setup

### 1. Database

Start MySQL, then create the schema:

```bash
cd server
mysql -u root < src/db/schema.sql
```

If your MySQL root user has a password, update `server/.env` and run:

```bash
mysql -u root -p < src/db/schema.sql
```

Seed demo users and sample tickets:

```bash
npm run db:seed
```

Demo accounts:

| Role       | Email             | Password    |
|------------|-------------------|-------------|
| Staff      | staff@company.com | staff123    |
| IT Officer | it@company.com    | officer123  |

### 2. API

```bash
cd server
cp .env.example .env   # if you need a fresh env file
npm install
npm run dev
```

API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173` and proxies `/api` to the Express server.

## API overview

| Method | Path                         | Access      | Description              |
|--------|------------------------------|-------------|--------------------------|
| POST   | `/api/auth/register`         | Public      | Create account           |
| POST   | `/api/auth/login`            | Public      | Sign in                  |
| GET    | `/api/auth/me`               | Auth        | Current user             |
| GET    | `/api/tickets/stats`         | Auth        | Dashboard counts         |
| GET    | `/api/tickets`               | Auth        | List / filter tickets    |
| POST   | `/api/tickets`               | Auth        | Create ticket            |
| GET    | `/api/tickets/:id`           | Auth        | Ticket + comments        |
| PATCH  | `/api/tickets/:id/status`    | IT Officer  | Change status            |
| POST   | `/api/tickets/:id/comments`  | Auth        | Add comment / resolution |

## Project structure

```
magashi/
├── client/          # React frontend
├── server/          # Express API + SQL schema
└── README.md
```
