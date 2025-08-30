# Projector Backend

Production-grade Node.js + Express backend with TypeScript, PostgreSQL, and Prisma ORM for the Projector application.

## Architecture

This backend follows a clean architecture pattern with:

- **Domain Layer**: Business logic, entities, and services
- **Infrastructure Layer**: Database, logging, metrics, and external services
- **API Layer**: Controllers, routes, middleware, and validation
- **Shared Layer**: Common types, utilities, and validation schemas

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Password Hashing**: Argon2id
- **Validation**: Zod schemas
- **Logging**: Winston with structured JSON
- **Metrics**: Prometheus
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with TypeScript
- **Containerization**: Docker + Docker Compose

## Database Schema

The application implements a comprehensive schema for project management:

- **Workers**: Employee management with roles and permissions
- **Programs**: Project/program tracking with workflow
- **Tasks**: Program task management with stations
- **Lookup Tables**: Status values, domains, engagement types, etc.
- **Audit Trail**: Created/updated timestamps and user tracking
- **Soft Delete**: Logical deletion with `deleted_at` timestamps

## Security Features

- **Authentication**: Employee ID + password login
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: Argon2id hashing with startup validation
- **JWT Tokens**: Short-lived access tokens + rotating refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers and CSP
- **Input Validation**: Zod schema validation for all endpoints

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 14+ or Docker
- npm or yarn

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/projector_db?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-at-least-32-characters-long"
REFRESH_SECRET="your-super-secure-refresh-secret-at-least-32-characters-long-and-different"
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:setup
```

3. Seed the database (development only):
```bash
npm run db:seed
```

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` with:
- API endpoints at `/api/*`
- Health check at `/health`
- Readiness check at `/ready`
- API documentation at `/api-docs`
- Metrics at `/metrics`

### Production Deployment

#### Using Docker Compose (Recommended)

1. Set environment variables:
```bash
export JWT_SECRET="your-production-jwt-secret"
export REFRESH_SECRET="your-production-refresh-secret"
export CORS_ALLOWED_ORIGINS="https://your-frontend-domain.com"
export PUBLIC_URL="https://your-backend-domain.com"
```

2. Start the services:
```bash
docker-compose up -d
```

#### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start in production mode:
```bash
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with employee ID and password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate refresh token

### Workers
- `GET /api/workers` - List workers with filtering and pagination
- `GET /api/workers/:id` - Get worker by ID
- `POST /api/workers` - Create new worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker (soft delete)

### Programs
- `GET /api/programs` - List programs with filtering and pagination
- `GET /api/programs/:id` - Get program by ID
- `POST /api/programs` - Create new program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program (soft delete)

### Health & Monitoring
- `GET /health` - Health check with database status
- `GET /ready` - Readiness check for load balancers
- `GET /metrics` - Prometheus metrics

## Database Operations

### Schema Management
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (no migrations)
npm run prisma:push

# Setup database (generate + push)
npm run db:setup
```

### Seeding
```bash
# Seed dictionary tables and test data
npm run db:seed
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Monitoring

The application provides comprehensive monitoring:

- **Health Checks**: `/health` and `/ready` endpoints
- **Metrics**: Prometheus metrics at `/metrics`
- **Logging**: Structured JSON logs with correlation IDs
- **Performance**: Request duration and database query metrics

## Security Considerations

- All passwords are hashed with Argon2id
- JWT secrets must be at least 32 characters
- Database connections use SSL in production
- Rate limiting on authentication endpoints
- CORS configured for specific origins
- Security headers via Helmet
- Input validation on all endpoints
- Audit trail for all data changes

## Deployment Architecture

Each customer gets:
- Isolated Docker container deployment
- Dedicated PostgreSQL database
- Separate environment configuration
- Independent scaling and monitoring

No shared resources or multi-tenant logic - complete isolation per customer.

## Development Guidelines

- Follow Repository + Service pattern
- Use TypeScript strict mode
- Implement comprehensive error handling
- Add tests for all business logic
- Use structured logging with correlation IDs
- Follow conventional commits
- Maintain API documentation

## Support

For issues and questions, please refer to the API documentation at `/api-docs` or contact the development team.