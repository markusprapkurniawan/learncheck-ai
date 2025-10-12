# Frontend Dockerfile - Multi-stage build for React + Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage - serve dengan nginx
FROM nginx:alpine

# Re-declare ARG for this stage
ARG VITE_API_URL=http://localhost:3001

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add build info
RUN echo "Build Date: $(date)" > /usr/share/nginx/html/build-info.txt && \
    echo "API URL: ${VITE_API_URL}" >> /usr/share/nginx/html/build-info.txt

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
