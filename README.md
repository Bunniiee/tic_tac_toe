# Multiplayer Tic-Tac-Toe Game

A production-ready multiplayer Tic-Tac-Toe game built with React TypeScript frontend and Nakama TypeScript backend. Features server-authoritative game logic, real-time multiplayer synchronization, matchmaking, timed mode, and persistent leaderboards.

## Features

- **Server-Authoritative Logic**: All game logic validated on the server to prevent cheating
- **Real-time Multiplayer**: Instant game state updates via Nakama sockets
- **Automatic Matchmaking**: Players are automatically paired for matches
- **Timed Mode**: 30-second time limit per move with auto-forfeit on timeout
- **Persistent Leaderboards**: Database-backed leaderboards with win streaks
- **Scalable Architecture**: Match isolation per room, can scale horizontally
- **Mobile Responsive**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React 18
- TypeScript (strict mode)
- Tailwind CSS
- Vite
- Nakama JS Client SDK

### Backend
- Nakama 3.22.0
- TypeScript Runtime
- PostgreSQL
- Docker

### Deployment
- Frontend: Vercel
- Backend: Fly.io

## Project Structure

```
tic_tac_toe/
├── frontend/                 # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/      # GameBoard, Lobby, MatchStatus, Timer
│   │   ├── contexts/        # NakamaContext for connection management
│   │   ├── hooks/           # Custom hooks for game state and matchmaking
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── nakama/                  # Nakama server with TypeScript module
│   ├── server/              # TypeScript server module
│   │   ├── src/
│   │   │   ├── match.ts     # Match handler (authoritative logic)
│   │   │   ├── rpc.ts       # RPC functions (matchmaking, stats)
│   │   │   ├── leaderboard.ts # Leaderboard management
│   │   │   ├── types.ts     # Server-side types
│   │   │   └── main.ts      # Module initialization
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── local.yml            # Local Nakama config
│   ├── Dockerfile           # For Fly.io deployment
│   ├── docker-compose.yml   # Local development
│   └── fly.toml             # Fly.io configuration
│
├── tests/                   # Test suites
│   ├── server/              # Server logic unit tests
│   └── integration/         # Client-server integration tests
│
└── README.md                # This file
```

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 12+ (or use Docker Compose)
- Fly.io account (for backend deployment)
- Vercel account (for frontend deployment)

### Local Development

#### 1. Backend Setup

1. Navigate to the nakama directory:
```bash
cd nakama
```

2. Build the server module:
```bash
cd server
npm install
npm run build
cd ..
```

3. Start Nakama and PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

4. Verify Nakama is running:
```bash
# Check logs
docker-compose logs nakama

# Nakama should be accessible at:
# - HTTP: http://localhost:7350
# - Socket: ws://localhost:7351
# - Console: http://localhost:7352 (admin/password)
```

#### 2. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Nakama server URL:
```env
VITE_NAKAMA_SERVER_URL=localhost
VITE_NAKAMA_SERVER_PORT=7351
VITE_NAKAMA_SERVER_KEY=defaultkey
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

## Deployment

### Backend Deployment (Fly.io)

1. Install Fly.io CLI:
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
# Download from https://fly.io/docs/getting-started/installing-flyctl/
```

2. Login to Fly.io:
```bash
fly auth login
```

3. Create a Fly.io app:
```bash
cd nakama
fly launch
```

4. Set environment variables:
```bash
fly secrets set DATABASE_URL=your_postgres_url
fly secrets set SOCKET_SERVER_KEY=your_server_key
```

5. Deploy:
```bash
fly deploy
```

6. Get your app URL:
```bash
fly status
```

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd frontend
vercel
```

4. Set environment variables in Vercel dashboard:
- `VITE_NAKAMA_SERVER_URL`: Your Fly.io app URL
- `VITE_NAKAMA_SERVER_PORT`: 443 (for HTTPS)
- `VITE_NAKAMA_SERVER_KEY`: Your server key

5. Redeploy:
```bash
vercel --prod
```

## Architecture Decisions

### Server-Authoritative Logic

All game logic runs on the Nakama server to prevent cheating:
- Move validation happens on the server
- Win detection is server-side
- Turn management is server-controlled
- Timeout handling is server-side

### Real-time Synchronization

Game state is synchronized in real-time using Nakama sockets:
- Server broadcasts game state updates to all players
- Client sends moves to server via socket messages
- Server validates and broadcasts validated moves

### Matchmaking

Uses Nakama's built-in matchmaker:
- Players are automatically paired when 2 are available
- Matchmaker creates matches and joins players
- Handles player disconnections gracefully

### Leaderboards

Database-backed leaderboards persist across server restarts:
- Wins, losses, draws tracked per player
- Win streaks calculated and displayed
- Leaderboard rankings updated on game completion

## Testing

### Unit Tests

Run server logic unit tests:
```bash
cd tests/server
npm test
```

### Integration Tests

Run integration tests:
```bash
cd tests/integration
npm test
```

## Configuration

### Nakama Configuration

Edit `nakama/local.yml` for local development settings:
- Database connection
- Socket configuration
- Runtime path for TypeScript module
- Logging levels

### Frontend Configuration

Edit `frontend/.env.local` for local development:
- Nakama server URL
- Server port
- Server key

## API Documentation

### RPC Functions

#### `find_match`
Starts matchmaking for a player.
- Returns: `{ success: boolean, ticket: string }`

#### `get_player_stats`
Retrieves player statistics.
- Returns: `{ success: boolean, stats: PlayerStats }`

#### `cancel_matchmaking`
Cancels active matchmaking.
- Returns: `{ success: boolean }`

### Socket Messages

#### Client to Server

- `MAKE_MOVE`: Send a move (row, col)
- `PING`: Keep-alive message

#### Server to Client

- `GAME_STATE`: Current game state update
- `MOVE_ACCEPTED`: Move was accepted
- `MOVE_REJECTED`: Move was rejected
- `GAME_OVER`: Game finished
- `PLAYER_JOINED`: Player joined match
- `PLAYER_LEFT`: Player left match
- `ERROR`: Error message
- `TIMEOUT_WARNING`: Timeout warning

## Troubleshooting

### Backend Issues

1. **Nakama not starting**: Check Docker logs:
```bash
docker-compose logs nakama
```

2. **Module not loading**: Verify build directory exists:
```bash
ls -la nakama/server/build
```

3. **Database connection issues**: Check PostgreSQL is running:
```bash
docker-compose ps postgres
```

### Frontend Issues

1. **Connection errors**: Verify Nakama server URL in `.env.local`
2. **Socket connection fails**: Check firewall and CORS settings
3. **Matchmaking not working**: Check Nakama server logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Acknowledgments

- [Nakama](https://heroiclabs.com/) for the game server
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

