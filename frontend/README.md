# Frontend Setup

This directory contains the React TypeScript frontend for the Tic-Tac-Toe game.

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Nakama server running (see `../nakama/README.md`)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your Nakama server URL:
```env
VITE_NAKAMA_SERVER_URL=localhost
VITE_NAKAMA_SERVER_PORT=7351
VITE_NAKAMA_SERVER_KEY=defaultkey
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

### Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview production build:
```bash
npm run preview
```

### Configuration

Edit `.env.local` for local development:
- `VITE_NAKAMA_SERVER_URL`: Nakama server URL
- `VITE_NAKAMA_SERVER_PORT`: Nakama server port
- `VITE_NAKAMA_SERVER_KEY`: Nakama server key

### Project Structure

- `src/components/`: React components (GameBoard, Lobby, MatchStatus, Timer)
- `src/contexts/`: Context providers (NakamaContext)
- `src/hooks/`: Custom hooks (useGameState, useMatchmaking)
- `src/types/`: TypeScript type definitions
- `src/App.tsx`: Main App component
- `src/main.tsx`: Application entry point

### Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

### Testing

Run tests:
```bash
npm test
```

### Deployment

See [docs/deployment.md](../docs/deployment.md) for Vercel deployment instructions.

## Troubleshooting

### Connection Errors

1. Verify Nakama server is running:
```bash
curl http://localhost:7350/healthz
```

2. Check environment variables in `.env.local`

3. Check browser console for errors

### Build Errors

1. Clear node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

2. Check TypeScript errors:
```bash
npm run build
```

3. Verify Node.js version:
```bash
node --version  # Should be 18+
```

### Socket Connection Issues

1. Verify socket URL is correct:
   - Local: `ws://localhost:7351`
   - Production: `wss://your-nakama-app.fly.dev`

2. Check CORS settings in Nakama server

3. Check firewall settings

