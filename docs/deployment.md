# Deployment Guide

This guide covers deploying the Tic-Tac-Toe game to production.

## Backend Deployment (Fly.io)

### Prerequisites

1. Install Fly.io CLI:
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
# Download from https://fly.io/docs/getting-started/installing-flyctl/
```

2. Create a Fly.io account:
```bash
fly auth signup
```

3. Login to Fly.io:
```bash
fly auth login
```

### Database Setup

1. Create a PostgreSQL database on Fly.io:
```bash
fly postgres create --name tic-tac-toe-db
```

2. Get database connection string:
```bash
fly postgres connect -a tic-tac-toe-db
```

3. Note the connection URL for later use

### App Deployment

1. Navigate to nakama directory:
```bash
cd nakama
```

2. Initialize Fly.io app:
```bash
fly launch
```

3. Follow the prompts:
   - App name: `tic-tac-toe-nakama` (or your preferred name)
   - Region: Choose closest to your users
   - PostgreSQL: Link to the database created above
   - Deploy now: No (we'll configure first)

4. Update `fly.toml` with your configuration:
```toml
app = "tic-tac-toe-nakama"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NAKAMA_DATABASE_URL = "postgres://nakama:${DATABASE_PASSWORD}@${DATABASE_HOST}:5432/nakama?sslmode=disable"
  NAKAMA_SOCKET_SERVER_KEY = "${SOCKET_SERVER_KEY}"

[http_service]
  internal_port = 7350
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
```

5. Set secrets:
```bash
fly secrets set SOCKET_SERVER_KEY=your-secret-key-here
fly secrets set DATABASE_PASSWORD=your-database-password
fly secrets set DATABASE_HOST=your-database-host
```

6. Build and deploy:
```bash
fly deploy
```

7. Check deployment status:
```bash
fly status
```

8. View logs:
```bash
fly logs
```

### Environment Variables

Set the following secrets in Fly.io:
- `SOCKET_SERVER_KEY`: Secret key for socket connections
- `DATABASE_PASSWORD`: PostgreSQL password
- `DATABASE_HOST`: PostgreSQL host

### Health Checks

Fly.io will automatically health check your app. Verify health:
```bash
fly status
```

### Scaling

Scale your app:
```bash
# Scale to 2 instances
fly scale count 2

# Scale to specific instance type
fly scale vm shared-cpu-1x
```

## Frontend Deployment (Vercel)

### Prerequisites

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Create a Vercel account:
```bash
vercel login
```

### Deployment

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Deploy to Vercel:
```bash
vercel
```

3. Follow the prompts:
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: `tic-tac-toe-frontend`
   - Directory: `./`
   - Override settings: No

4. Set environment variables in Vercel dashboard:
   - Go to https://vercel.com/your-account/your-project/settings/environment-variables
   - Add the following:
     - `VITE_NAKAMA_SERVER_URL`: Your Fly.io app URL (e.g., `tic-tac-toe-nakama.fly.dev`)
     - `VITE_NAKAMA_SERVER_PORT`: `443`
     - `VITE_NAKAMA_SERVER_KEY`: Your server key

5. Redeploy with environment variables:
```bash
vercel --prod
```

### Custom Domain

1. Add custom domain in Vercel dashboard
2. Update DNS records as instructed
3. Wait for DNS propagation
4. SSL certificate will be automatically provisioned

### Environment Variables

Set the following in Vercel:
- `VITE_NAKAMA_SERVER_URL`: Your Fly.io app URL
- `VITE_NAKAMA_SERVER_PORT`: `443` (for HTTPS)
- `VITE_NAKAMA_SERVER_KEY`: Your server key

## Post-Deployment

### Verify Deployment

1. Check backend is running:
```bash
curl https://your-nakama-app.fly.dev/healthz
```

2. Check frontend is accessible:
```bash
curl https://your-frontend-app.vercel.app
```

### Update Configuration

1. Update frontend environment variables if backend URL changes
2. Redeploy frontend after backend changes
3. Monitor logs for errors:
```bash
# Backend logs
fly logs

# Frontend logs (in Vercel dashboard)
```

## Troubleshooting

### Backend Issues

1. **App not starting**: Check logs:
```bash
fly logs
```

2. **Database connection errors**: Verify database secrets:
```bash
fly secrets list
```

3. **Module not loading**: Check build output:
```bash
fly ssh console
ls -la /nakama/build
```

### Frontend Issues

1. **Connection errors**: Verify environment variables:
   - Check Vercel dashboard
   - Verify backend URL is correct
   - Check CORS settings

2. **Build errors**: Check build logs in Vercel dashboard

3. **Runtime errors**: Check browser console for errors

## Monitoring

### Fly.io Monitoring

1. View app metrics:
```bash
fly metrics
```

2. View app status:
```bash
fly status
```

3. View app logs:
```bash
fly logs
```

### Vercel Monitoring

1. View deployment logs in Vercel dashboard
2. Check analytics for traffic
3. Monitor error rates

## Security

### Backend Security

1. Use strong secrets:
```bash
fly secrets set SOCKET_SERVER_KEY=$(openssl rand -hex 32)
```

2. Enable HTTPS only:
```toml
[http_service]
  force_https = true
```

3. Restrict database access:
   - Use strong database passwords
   - Restrict database to app network only

### Frontend Security

1. Use HTTPS only (automatic in Vercel)
2. Set secure headers (configured in `vercel.json`)
3. Validate environment variables
4. Use secure socket connections (WSS)

## Cost Optimization

### Fly.io

1. Use shared CPU instances for development
2. Enable auto-stop for non-production apps
3. Monitor usage:
```bash
fly usage
```

### Vercel

1. Use free tier for development
2. Upgrade to Pro for production
3. Monitor bandwidth usage

## Backup & Recovery

### Database Backups

1. Enable automatic backups in Fly.io PostgreSQL
2. Manual backup:
```bash
fly postgres backup create -a tic-tac-toe-db
```

3. Restore backup:
```bash
fly postgres backup restore -a tic-tac-toe-db <backup-id>
```

### Code Backups

1. Use Git for version control
2. Tag releases:
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Updates

### Backend Updates

1. Make changes to code
2. Build and test locally
3. Deploy:
```bash
fly deploy
```

### Frontend Updates

1. Make changes to code
2. Test locally
3. Deploy:
```bash
vercel --prod
```

## Rollback

### Backend Rollback

1. List deployments:
```bash
fly releases
```

2. Rollback to previous version:
```bash
fly releases rollback <release-id>
```

### Frontend Rollback

1. Go to Vercel dashboard
2. Select deployment
3. Click "Promote to Production"

