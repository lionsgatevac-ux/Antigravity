# Use Node.js LTS (>=22 required by @supabase/supabase-js realtime - native WebSocket)
FROM node:22-slim

# Install system dependencies (Puppeteer/Chromium dependencies)
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# WORKDIR ROOT
WORKDIR /app

# --- FRONTEND (Pre-built) ---
# Skip build in container, use local dist
WORKDIR /app
COPY frontend/dist ./frontend/dist

# --- BACKEND SETUP ---
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .

# Ensure upload/generated directories exist
RUN mkdir -p uploads generated ../templates

# Copy templates if they are in root/templates (based on prev structure they were in root/templates?)
# Previous Dockerfile: RUN mkdir -p backend/uploads ... templates
# documentGenerator.js expects: path.join(__dirname, '..', '..', 'templates') -> /app/templates
# So we need to copy templates to /app/templates.
WORKDIR /app
COPY templates/ ./templates/

# Copy Custom Fonts
# COPY fonts/ /usr/share/fonts/truetype/custom/
# RUN fc-cache -f -v

# Environment
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start the server directly
CMD [ "node", "backend/server.js" ]
