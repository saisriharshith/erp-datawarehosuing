# ==========================================
# Multi-Stage Production Dockerfile for Render
# ==========================================

# STAGE 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# STAGE 2: Production Node.js Server
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy server code, database seeds, and entry points
COPY server/ ./server/
COPY server.js ./
COPY data/ ./data/

# Copy compiled React static assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["node", "server.js"]
