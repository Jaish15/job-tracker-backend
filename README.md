# Job Tracker — Backend API

NestJS REST API with JWT authentication, role-based access control, and PostgreSQL via TypeORM.

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL (via TypeORM)
- **Auth**: JWT (JSON Web Tokens) + Passport.js
- **Validation**: class-validator / class-transformer
- **Docs**: Swagger / OpenAPI
- **Deploy**: AWS Lambda (via serverless framework)

## Auth Concepts

### JWT (JSON Web Tokens)
A JWT is a compact, self-contained token with three parts: `header.payload.signature`.
- The server signs the token with a secret key on login
- The client stores it (localStorage) and sends it in every request as `Authorization: Bearer <token>`
- The server verifies the signature — no database lookup needed per request

### Roles
Three roles are supported:
| Role | Access |
|------|--------|
| `admin` | Full access — all users, all jobs |
| `user` | Own jobs only |
| `recruiter` | Own jobs only (extendable) |

### SSO / OAuth (for future extension)
SSO (Single Sign-On) lets users authenticate via a third-party provider (Google, GitHub).
OAuth 2.0 is the protocol — the provider issues an access token, your app exchanges it for a user profile.
To add Google OAuth: install `passport-google-oauth20` and add a `GoogleStrategy`.

## Prerequisites

- Node.js 20+
- PostgreSQL running locally or on EC2

## Setup

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# Start in development (auto-restarts on change)
npm run start:dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | DB user | `postgres` |
| `DB_PASSWORD` | DB password | — |
| `DB_NAME` | Database name | `job_tracker` |
| `JWT_SECRET` | Secret for signing JWTs | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | App port | `3000` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Users (JWT required)
| Method | Path | Access |
|--------|------|--------|
| GET | `/api/users/me` | Any authenticated user |
| GET | `/api/users` | Admin only |
| GET | `/api/users/:id` | Admin only |
| PATCH | `/api/users/:id` | Owner or Admin |
| DELETE | `/api/users/:id` | Admin only |

### Jobs (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jobs` | Create job application |
| GET | `/api/jobs` | List jobs (own, or all for admin) |
| GET | `/api/jobs/stats` | Job statistics |
| GET | `/api/jobs/:id` | Get single job |
| PATCH | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |

### Query Filters (GET /api/jobs)
- `?status=applied` — filter by status
- `?company=Acme` — filter by company name

## Swagger Docs

Visit `http://localhost:3000/api/docs` when running locally.

## Database Setup (PostgreSQL on EC2)

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install PostgreSQL
sudo dnf install postgresql15-server -y
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE job_tracker;
CREATE USER jobuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE job_tracker TO jobuser;
\q
```

## Deploy to AWS Lambda

```bash
# Install serverless framework
npm install -g serverless

# Install Lambda adapter
npm install aws-serverless-express

# Build
npm run build

# Deploy
serverless deploy --stage prod
```

## Scripts

```bash
npm run start:dev    # Development with hot reload
npm run build        # Production build
npm run start:prod   # Run production build
npm run test         # Run unit tests
```
