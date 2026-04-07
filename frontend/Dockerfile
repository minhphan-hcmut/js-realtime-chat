# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Build static assets với Vite
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite build ra thư mục dist/
RUN npm run build

# =============================================================================
# Stage 2: Image chỉ chứa static files
# Không có Nginx — Nginx được cấu hình thủ công trên prod server.
# Jenkins pipeline sẽ extract thư mục /static/dist/ từ image này
# và copy vào Nginx webroot (FRONTEND_WEBROOT) trên prod server.
# =============================================================================
FROM alpine:3.19 AS static

RUN addgroup -g 1001 -S static && \
    adduser -S staticuser -u 1001 -G static

WORKDIR /static

COPY --from=builder --chown=staticuser:static /app/dist ./dist

# Image này không có CMD — chỉ dùng để chứa và extract file
