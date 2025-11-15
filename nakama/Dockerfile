# Dockerfile for Nakama server with TypeScript module
# For Fly.io deployment

# Stage 1: Build TypeScript server module
FROM node:20-alpine AS builder

WORKDIR /build

# Copy server module files
COPY server/package.json server/tsconfig.json ./
COPY server/src ./src

# Install dependencies and build
RUN npm install
RUN npm run build

# Stage 2: Nakama server with compiled module
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

# Copy compiled JavaScript files to Nakama runtime directory
COPY --from=builder /build/build /nakama/build

# Copy configuration file
COPY local.yml /nakama/local.yml

# Expose Nakama ports
# 7349 - gRPC API
# 7350 - HTTP API  
# 7351 - Socket API
EXPOSE 7349 7350 7351

# Default command (can be overridden by Fly.io)
CMD ["/nakama/nakama", "--config", "/nakama/local.yml"]

