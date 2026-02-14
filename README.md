# FastTrack - Shipment Management System

A full-stack logistics application for synchronizing shipment data between an internal PostgreSQL database and an external carrier API.

## Tech Stack

- **Backend**: Node.js 24+ / Express / TypeScript
- **Frontend**: React 18 / Vite / TypeScript
- **Database**: PostgreSQL 16 / Prisma ORM
- **Mock Carrier API**: JSON Server
- **Testing**: Jest / Supertest
- **Containerization**: Docker / Docker Compose

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                     http://localhost:5173                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│                     http://localhost:3000                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │Controller │──│  Service  │──│Repository │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│        │              │              │                       │
│        │        ┌─────┴─────┐        │                       │
│        │        │SyncService│        │                       │
│        │        │  + Cron   │        │                       │
│        │        └─────┬─────┘        │                       │
└────────┼──────────────┼──────────────┼──────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Mock API   │  │ Carrier API │  │  PostgreSQL │
│ JSON Server │  │   Client    │  │   Database  │
│ :3001       │  │   (axios)   │  │   :5432     │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Features

- **CRUD Operations**: Create, read, update, and delete shipments
- **Synchronization**: Automatic (cron) and manual sync with external carrier API
- **Race Condition Handling**: Mutex locks prevent concurrent sync conflicts
- **Retry Logic**: Exponential backoff for failed API calls
- **Conflict Resolution**: "Last Write Wins" based on timestamps
- **Logging**: Structured logging with Winston
- **Validation**: Request validation with Zod schemas
- **Pagination**: Paginated API responses with status filtering

## Project Structure

```
fasttrack/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment, logger, database, cron
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic + sync orchestration
│   │   ├── repositories/    # Data access layer
│   │   ├── external/        # Carrier API client
│   │   ├── middlewares/     # Error handling, validation
│   │   ├── dtos/            # Zod schemas & types
│   │   ├── utils/           # Errors, retry, mutex
│   │   └── routes/          # Express routes
│   ├── tests/               # Unit & integration tests
│   └── prisma/              # Database schema
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
├── mock-carrier/            # JSON Server mock API
├── docker-compose.yml       # Production compose
└── docker-compose.dev.yml   # Development compose
```

## Quick Start

### Prerequisites

- Node.js >= 24.0.0
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   cd fasttrack

   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

2. **Start with Docker Compose (recommended)**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Or run services separately**:
   ```bash
   # Start PostgreSQL and mock carrier
   docker-compose -f docker-compose.dev.yml up -d db mock-carrier

   # Run database migrations
   cd backend
   cp .env.example .env
   npm run db:migrate

   # Start backend
   npm run dev

   # Start frontend (new terminal)
   cd ../frontend
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1
   - Mock Carrier API: http://localhost:3001
   - Health Check: http://localhost:3000/health

### Production Setup

```bash
docker-compose up -d
```

## API Endpoints

### Shipments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shipments` | List all shipments |
| GET | `/api/v1/shipments/:id` | Get single shipment |
| POST | `/api/v1/shipments` | Create shipment |
| PATCH | `/api/v1/shipments/:id` | Update shipment |
| DELETE | `/api/v1/shipments/:id` | Delete shipment |
| POST | `/api/v1/sync` | Trigger manual sync |
| GET | `/health` | Health check |

### Query Parameters

- `status`: Filter by status (`PENDING`, `IN_TRANSIT`, `DELIVERED`, `FAILED`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

## Example Requests

### Create Shipment
```bash
curl -X POST http://localhost:3000/api/v1/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-001",
    "customerName": "John Doe",
    "destination": "123 Main St, New York, NY 10001"
  }'
```

### Get All Shipments
```bash
curl http://localhost:3000/api/v1/shipments?status=PENDING&page=1&limit=10
```

### Update Shipment
```bash
curl -X PATCH http://localhost:3000/api/v1/shipments/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_TRANSIT"
  }'
```

### Trigger Sync
```bash
# Sync all shipments
curl -X POST http://localhost:3000/api/v1/sync \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync single shipment
curl -X POST http://localhost:3000/api/v1/sync \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "uuid-here"
  }'
```

## Example Responses

### Paginated Shipments
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "orderId": "ORD-2024-001",
      "customerName": "John Doe",
      "destination": "123 Main St, New York, NY 10001",
      "status": "PENDING",
      "lastSyncedAt": null,
      "carrierRef": null,
      "createdAt": "2024-12-15T10:30:00.000Z",
      "updatedAt": "2024-12-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Sync Result
```json
{
  "data": {
    "synced": 5,
    "failed": 1,
    "errors": [
      {
        "shipmentId": "abc-123",
        "error": "Carrier API timeout"
      }
    ],
    "duration": 1234
  }
}
```

## Running Tests

```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

## Synchronization

### How It Works

1. **Scheduled Sync**: Runs every 5 minutes (configurable via `SYNC_CRON_SCHEDULE`)
2. **Manual Sync**: Trigger via `POST /api/v1/sync`
3. **Race Condition Prevention**: Global mutex lock prevents concurrent syncs
4. **Retry Logic**: Failed API calls retry with exponential backoff (1s, 2s, 4s)

### Conflict Resolution

The system uses "Last Write Wins" strategy based on timestamps:
- If carrier data is newer → Update local database
- If local data is newer → Push to carrier API
- If timestamps match → No action needed

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 3000 | API server port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `CARRIER_API_URL` | http://localhost:3001 | External carrier API URL |
| `CARRIER_API_TIMEOUT` | 5000 | API timeout in ms |
| `SYNC_CRON_SCHEDULE` | */5 * * * * | Cron schedule for auto-sync |
| `SYNC_ENABLED` | true | Enable/disable scheduled sync |
| `RETRY_MAX_ATTEMPTS` | 3 | Max retry attempts |
| `RETRY_BASE_DELAY` | 1000 | Base retry delay in ms |
| `LOG_LEVEL` | debug | Logging level |

## Design Choices

### Layered Architecture
- **Controller**: Handles HTTP concerns only
- **Service**: Contains business logic
- **Repository**: Data access abstraction

### Why Prisma?
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations

### Why Zod?
- Runtime validation with TypeScript inference
- Schema composition
- Clear error messages

### Race Condition Handling
- `async-mutex` for application-level locks
- Optimistic locking with version field
- Database transactions for atomic operations
