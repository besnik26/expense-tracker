# Expense Tracker Backend

This project is a backend-only Express API for an expense tracker application built for a bachelor thesis. It supports user authentication, transaction management, filtering, dashboard summaries, and Swagger-based API testing.

## Features

- User registration and login
- JWT-based protected routes
- Transaction CRUD with user ownership restrictions
- Filtering by month, category, and type
- Pagination support
- Dashboard totals and recent transactions
- Category list endpoint
- Request validation and centralized error handling
- Swagger UI for manual API testing

## Technologies used

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- dotenv
- CORS
- express-validator
- Swagger UI + swagger-jsdoc
- Jest + Supertest

## Requirements

- Node.js 18+
- MongoDB Atlas account
- A MongoDB Atlas connection string

## Installation

1. Clone the project.
2. Open the project folder.
3. Install dependencies:

```bash
npm install
```

4. Copy the environment file:

```bash
copy .env.example .env
```

5. Add your MongoDB Atlas connection string and JWT secret in the `.env` file.

## Environment variables

Create a `.env` file using the example values below:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expense-tracker
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
```

### MongoDB Atlas setup

1. Create a MongoDB Atlas account.
2. Create a cluster and database user.
3. Get the connection string from Atlas.
4. Paste it into `MONGODB_URI` in your `.env` file.
5. Make sure your network allows connections from your current IP address or use the Atlas connection configuration.

## Running the server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server runs on port 5000 by default unless you set a different `PORT` in `.env`.

## Running tests

```bash
npm test
```

## API endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Transactions

- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Categories

- `GET /api/categories`

### Dashboard

- `GET /api/dashboard`

## Swagger documentation

Once the server is running, open:

```text
http://localhost:5000/api-docs
```

Swagger UI allows you to test protected endpoints by providing a bearer token in the authorization section.

## Authentication flow

1. Register via `POST /api/auth/register`.
2. Log in via `POST /api/auth/login`.
3. Copy the JWT returned in the response.
4. Send it in the Authorization header as:

```http
Authorization: Bearer <token>
```

5. Use the token on protected routes such as transactions and dashboard.

Logout is intentionally stateless. The frontend should remove the stored JWT from local storage or memory after a successful logout.

## Example requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "secret123"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "secret123"
  }'
```

### Create transaction

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "expense",
    "amount": 15.5,
    "category": "Food",
    "date": "2026-08-30",
    "description": "Lunch"
  }'
```

### Get filtered transactions

```bash
curl "http://localhost:5000/api/transactions?month=2026-08&type=expense&category=Food&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

## Notes

- Passwords are hashed with bcrypt.
- Users cannot access another user's transactions.
- All transaction endpoints are protected.
- The backend does not include Angular frontend code.
