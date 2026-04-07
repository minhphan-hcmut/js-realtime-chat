# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Install production dependencies only
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Chỉ cài production dependencies (bỏ qua devDependencies)
RUN npm ci --omit=dev

# =============================================================================
# Stage 2: Production runtime image
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Tạo non-root user để chạy app (bảo mật)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Copy node_modules từ stage deps
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodeuser:nodejs src/ ./src/

# Chạy với user không có quyền root
USER nodeuser

EXPOSE 3000

# Dùng exec form để process nhận tín hiệu SIGTERM đúng (graceful shutdown)
CMD ["node", "src/server.js"]
