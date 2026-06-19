# Build stage
FROM node:20.14.0-alpine3.20 AS build
WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN VITE_API_URL=${VITE_API_URL} pnpm build

# Final stage
FROM nginx:1.26-alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user, nginx cache dirs, and set ownership
RUN adduser -D -g '' appuser && \
    touch /run/nginx.pid && \
    chown appuser:appuser /run/nginx.pid && \
    chown -R appuser:appuser /usr/share/nginx/html && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
