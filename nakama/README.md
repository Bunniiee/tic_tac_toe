# Nakama Server Setup

This directory contains the Nakama server with TypeScript runtime module for the Tic-Tac-Toe game.

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- PostgreSQL 12+ (or use Docker Compose)

### Setup

1. Build the server module:
```bash
cd server
npm install
npm run build
cd ..
```

2. Start Nakama and PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

3. Verify Nakama is running:
```bash
# Check logs
docker-compose logs nakama

# Nakama should be accessible at:
# - HTTP: http://localhost:7350
# - Socket: ws://localhost:7351
# - Console: http://localhost:7352 (admin/password)
```

4. Stop services:
```bash
docker-compose down
```

### Configuration

Edit `local.yml` for local development settings:
- Database connection
- Socket configuration
- Runtime path for TypeScript module
- Logging levels

### Building the Server Module

The server module must be built before running Nakama:

```bash
cd server
npm install
npm run build
cd ..
```

The compiled JavaScript files will be in `server/build/` directory.

### Module Structure

- `server/src/main.ts`: Module initialization and registration
- `server/src/match.ts`: Match handler with game logic
- `server/src/rpc.ts`: RPC functions (matchmaking, stats)
- `server/src/leaderboard.ts`: Leaderboard management
- `server/src/types.ts`: TypeScript type definitions

### Testing

Run server logic tests:
```bash
cd tests/server
npm test
```

## Deployment

See [docs/deployment.md](../docs/deployment.md) for Fly.io deployment instructions.

## Troubleshooting

### Module Not Loading

1. Verify build directory exists:
```bash
ls -la server/build
```

2. Check runtime path in `local.yml`:
```yaml
runtime:
  path: "./build"
```

3. Check Nakama logs:
```bash
docker-compose logs nakama
```

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
docker-compose ps postgres
```

2. Verify database connection string in `local.yml`

3. Check database logs:
```bash
docker-compose logs postgres
```

### Build Errors

1. Check TypeScript compilation errors:
```bash
cd server
npm run build
```

2. Verify Node.js version:
```bash
node --version  # Should be 18+
```

3. Clear build directory and rebuild:
```bash
cd server
npm run clean
npm install
npm run build
```

