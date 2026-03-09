# node-template

A production-ready TypeScript/Express microservice starter template with security-first design,
full type safety, and a complete development workflow.

## Features

- **TypeScript** with strict mode for full type safety
- **Express.js** web framework
- **Prisma ORM** with PostgreSQL
- **Zod** for runtime input validation and environment variable validation
- **Pino** structured logging (with pretty-printing in development)
- **Security-first**: bcrypt password hashing, JWT authentication, timing-safe API key comparison
- **Soft deletes** for data recovery
- **Rate limiting** with configurable limiters
- **Conventional Commits** enforced via commitlint and Husky
- **Docker** multi-stage build support
- **GitHub Actions** CI/CD workflows

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values (DATABASE_URL, JWT_SECRET, etc.)

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run database migrations
npm run prisma:migrate:new

# 5. Start development server
npm run dev
```

## Folder Structure

```
project-root/
├── src/
│   ├── config/           # Environment and database configuration
│   ├── controllers/      # Route handler functions
│   ├── dtos/             # Data Transfer Object type definitions
│   ├── middleware/       # Express middleware (validation, auth, rate-limit, logging)
│   ├── routes/           # Express route definitions
│   ├── schema/           # Zod validation schemas
│   ├── services/         # Business logic and database services
│   ├── types/            # Global TypeScript types
│   ├── utils/            # Utility functions (errors, logger, jwt, password, html)
│   └── server.ts         # Application entry point
├── prisma/
│   └── schema.prisma     # Prisma data model
├── .github/workflows/    # CI/CD pipeline definitions
├── .husky/               # Git hooks (pre-commit, commit-msg)
├── Dockerfile            # Multi-stage Docker build
├── docker-entrypoint.sh  # Container startup script
└── ...config files
```

## API Endpoints

All routes are prefixed with `/api/v1`.

### Health

| Method | Path             | Description  |
| ------ | ---------------- | ------------ |
| GET    | `/api/v1/health` | Health check |

**Response:**

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.45
  }
}
```

### Users (Example Resource)

| Method | Path                | Description      | Body             |
| ------ | ------------------- | ---------------- | ---------------- |
| GET    | `/api/v1/users`     | List all users   | -                |
| GET    | `/api/v1/users/:id` | Get user by ID   | -                |
| POST   | `/api/v1/users`     | Create a user    | See schema below |
| PATCH  | `/api/v1/users/:id` | Update a user    | See schema below |
| DELETE | `/api/v1/users/:id` | Soft-delete user | -                |

**Create User Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

## Environment Variables

| Variable         | Required | Default        | Description                       |
| ---------------- | -------- | -------------- | --------------------------------- |
| `NODE_ENV`       | No       | `development`  | `development` or `production`     |
| `PORT`           | No       | `3000`         | HTTP server port                  |
| `DATABASE_URL`   | **Yes**  | -              | PostgreSQL connection string      |
| `JWT_SECRET`     | **Yes**  | -              | JWT signing secret (min 32 chars) |
| `JWT_EXPIRY`     | No       | `3600`         | JWT expiry in seconds             |
| `SERVICE_NAME`   | No       | `microservice` | Service name used in logs         |
| `LOG_LEVEL`      | No       | `info`         | Pino log level                    |
| `DOPPLER_TOKEN`  | No       | -              | Doppler secrets manager token     |
| `DOPPLER_CONFIG` | No       | -              | Doppler config name               |

## Development Commands

```bash
npm run dev               # Start with nodemon (hot reload)
npm run build             # Compile TypeScript to dist/
npm run start:development # Run compiled app
npm run start:production  # Run compiled app (production)
npm run lint:check        # Check for lint errors
npm run lint:fix          # Auto-fix lint errors
npm run format:check      # Check formatting
npm run format:fix        # Auto-fix formatting
npm run types:check       # Type-check without emitting
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate:new# Create and run a new migration
```

## Docker

```bash
# Build the image
docker build -t my-service .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-32-char-secret \
  my-service
```

## Deployment

The repository includes GitHub Actions workflows:

- **`pr-quality-check.yml`**: Runs lint, format, type-check on every PR
- **`release-main.yml`**: Runs semantic-release on pushes to `main`, auto-deploys to production
- **`release-develop.yml`**: Runs semantic-release on pushes to `develop`, auto-deploys to development
- **`deploy.yml`**: Reusable workflow that builds Docker, pushes to ECR, deploys to EC2

### GitHub Secrets Configuration

Go to **Repository Settings → Secrets and variables → Actions** and add these secrets:

#### Required Secrets

| Secret                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS IAM user with EC2 and ECR permissions      |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key                        |
| `EC2_HOST`              | Public IP or DNS of your EC2 instance          |
| `EC2_USER`              | SSH username (e.g., `ec2-user`, `ubuntu`)      |
| `EC2_SSH_KEY`           | Private SSH key for EC2 authentication         |
| `RELEASE_TOKEN`         | GitHub Personal Access Token with `repo` scope |

#### Required Variables

| Variable         | Description                   | Example           |
| ---------------- | ----------------------------- | ----------------- |
| `AWS_REGION`     | AWS region                    | `us-east-1`       |
| `ECR_REPOSITORY` | ECR repository name           | `my-service`      |
| `CONTAINER_NAME` | Docker container name         | `my-service`      |
| `CONTAINER_PORT` | Container port                | `3000`            |
| `SECRET`         | AWS Secrets Manager secret ID | `my-service/prod` |

### AWS Secrets Manager Setup

Create a secret in AWS Secrets Manager with all required environment variables:

1. Go to **AWS Console → Secrets Manager → Store a new secret**
2. Choose **Other type of secret (key/value)**
3. Add all required keys:

```json
{
  "DATABASE_URL": "postgresql://user:password@host:5432/dbname",
  "JWT_SECRET": "your-jwt-secret-min-32-chars",
  "JWT_EXPIRES_IN": "15",
  "JWT_REFRESH_EXPIRES_IN": "7",
  "JWT_RESET_PASSWORD_EXPIRES_IN": "1",
  "DELIVEROO_CLONE_API_KEY": "your-api-key",
  "SERVICE_NAME": "my-service",
  "PORT": "3000",
  "NODE_ENV": "production",
  "LOG_LEVEL": "info",
  "BASE_URL": "https://api.example.com",
  "COMPANY_NAME": "My Company",
  "COMPANY_EMAIL": "noreply@example.com",
  "LOGO_URL": "https://example.com/logo.png",
  "SUPPORT_EMAIL": "support@example.com",
  "APP_URL": "https://example.com",
  "RESEND_API_KEY": "re_xxxxxxxxxxxx"
}
```

4. Name the secret (e.g., `my-service/prod`) - use this as the `SECRET` variable in GitHub

### IAM Policy for Deploy User

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:region:account:secret:my-service/*"
    }
  ]
}
```

### Manual Trigger

You can manually trigger releases from GitHub Actions:

1. Go to **Actions → CI/CD — Production Release** (or Development)
2. Click **Run workflow**
3. Select the environment and click **Run workflow**

Both workflows also run automatically on push to `main` (production) or `develop` (development).
