# ==============================================================================
# Multi-Stage Dockerfile for Full-Stack Deployment (Hugging Face Spaces / Cloud)
# Runs both React Frontend (Vite) and FastAPI AI Backend on 16GB RAM for FREE!
# ==============================================================================

# Stage 1: Build Frontend SPA
FROM node:20-slim AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Production Web Server
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=7860 \
    FRONTEND_DIST_PATH=/app/frontend_dist

WORKDIR /app

# Install system dependencies for OpenCV and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (UID 1000) for Hugging Face Spaces security policy
RUN useradd -m -u 1000 user && \
    mkdir -p /app /home/user/.insightface /home/user/.cache && \
    chown -R user:user /app /home/user

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source code
COPY backend/ ./backend/

# Copy compiled frontend from builder stage
COPY --from=frontend-builder /build/frontend/dist /app/frontend_dist

# Fix permissions
RUN chown -R user:user /app /home/user

USER user

EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
