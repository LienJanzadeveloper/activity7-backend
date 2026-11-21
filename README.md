# Activity 7 - IT Support Desk API

Backend REST API for the IT Support Desk system built with Node.js, Express and PostgreSQL.

## Run locally
1. Copy `.env.example` to `.env`.
2. Add a PostgreSQL connection string for `DATABASE_URL`.
3. Install packages: `npm install`
4. Start: `npm start`
5. Open `http://localhost:3000`

## Routes
- GET `/`
- GET `/health`
- GET `/api/records`
- GET `/api/records/:id`
- POST `/api/records`
- PUT `/api/records/:id`
- DELETE `/api/records/:id`

Records use title, category, description, status. Valid status values: Pending, In progress, Completed.
