# =============================================
# Multi-stage Dockerfile for React Frontend
# Stage 1: Build with Node
# Stage 2: Serve with Nginx Alpine
# =============================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies separately
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Runtime (Nginx) ---
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
