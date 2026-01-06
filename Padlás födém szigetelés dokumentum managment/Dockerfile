# Használjunk egy hivatalos Node.js runtime-ot
FROM node:18-slim

# Munkakönyvtár beállítása
WORKDIR /app

# Másoljuk a package.json fájlokat mindkét helyről
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Telepítsük a függőségeket
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Másoljuk a forráskódot
COPY . .

# Buildeljük a frontendet
RUN cd frontend && npm run build

# Port beállítása (Cloud Run alapértelmezetten 8080-at vár, de a server.js-ben process.env.PORT-ot használunk)
EXPOSE 8080
ENV PORT 8080
ENV NODE_ENV production

# Mappa struktúra javítása (ha szükséges, pl. uploads és generated mappák létrehozása)
RUN mkdir -p backend/uploads backend/generated templates

# Indítás
CMD ["node", "backend/server.js"]
