# Backend Dockerfile - NO .env file dependency
FROM node:20-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code (exclude .env via .dockerignore)
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs && \
    chown -R backend:nodejs /app

USER backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start server (env vars from docker-compose)
CMD ["node", "src/index.js"]
