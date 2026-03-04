# Use Node.js LTS
FROM node:18-slim

# Install system dependencies (LibreOffice, fonts)
# RUN apt-get update && apt-get install -y \
#     fontconfig \
#     libreoffice \
#     default-jre \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR ROOT
WORKDIR /app

# --- FRONTEND BUILD ---
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

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
CMD [ "node", "server.js" ]
