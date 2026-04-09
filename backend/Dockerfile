FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./


RUN npm ci --omit=dev


FROM node:20-alpine AS runner

WORKDIR /app


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs


COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules


COPY --chown=nodeuser:nodejs src/ ./src/


USER nodeuser

EXPOSE 3000


CMD ["node", "src/server.js"]
