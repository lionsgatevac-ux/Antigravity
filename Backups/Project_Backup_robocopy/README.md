# 🏗️ Padlásfödém Szigetelés - Dokumentum Menedzsment Rendszer

**BO-ZSO Hungary Kft** - Teljes PWA alapú projekt menedzsment és dokumentum generáló rendszer

---

## 📋 Funkciók

- ✅ **Offline PWA** - Tablet optimalizált, offline működés
- 📝 **Adatgyűjtés** - Multi-step form ügyfél, ingatlan, műszaki adatokhoz
- 📄 **DOCX Generálás** - Automatikus dokumentum kitöltés (szerződések, jegyzőkönyvek)
- 📸 **Fotódokumentáció** - Képek rögzítése és tárolása
- ✍️ **Digitális Aláírás** - Aláírás rögzítés és mentés
- 📊 **Admin Dashboard** - Projektek kezelése, statisztikák
- 🔄 **Szinkronizálás** - Offline-online automatikus szinkronizálás

---

## 🚀 Gyors Telepítés

### Előfeltételek

- Node.js 18+ ([letöltés](https://nodejs.org/))
- PostgreSQL 14+ vagy Supabase account
- Git

### 1. Projekt Klónozása

```bash
git clone <repository-url>
cd "Padlás födém szigetelés dokumentum managment"
```

### 2. Függőségek Telepítése

```bash
npm run install:all
```

### 3. Environment Beállítás

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Szerkeszd a .env fájlt az adatbázis adatokkal
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Szerkeszd a .env fájlt a backend URL-lel
```

### 4. Adatbázis Inicializálás

```bash
cd backend
npm run db:setup
```

### 5. Fejlesztői Szerver Indítás

```bash
# Root könyvtárban - mindkét szerver egyszerre
npm run dev

# Vagy külön-külön:
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

---

## 📁 Projekt Struktúra

```
bozso-padlas-system/
├── frontend/              # React PWA alkalmazás
│   ├── src/
│   │   ├── components/    # UI komponensek
│   │   ├── pages/         # Oldalak
│   │   ├── services/      # API, IndexedDB
│   │   ├── context/       # State management
│   │   └── utils/         # Helper függvények
│   └── public/            # Statikus fájlok
├── backend/               # Node.js API
│   ├── controllers/       # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── database/          # SQL schemas
├── templates/             # DOCX sablonok
│   ├── kivitelezesi_szerzodes_template.docx
│   ├── atadas_atveteli_template.docx
│   ├── kivitelezoi_nyilatkozat_template.docx
│   └── megallapodas_hem_template.docx
└── database/              # Database scripts
```

---

## 🔧 Technológiai Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Dexie.js** - IndexedDB wrapper (offline storage)
- **Signature Pad** - Digitális aláírás
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - API server
- **PostgreSQL** - Adatbázis
- **docxtemplater** - DOCX generálás
- **Multer** - Fájl feltöltés
- **pg** - PostgreSQL client

---

## 📱 Használat

### Új Projekt Létrehozása

1. **Ügyfél adatok** - Név, cím, elérhetőség
2. **Ingatlan adatok** - Cím, HRSZ, épület jellemzők
3. **Műszaki felmérés** - Területek, szigetelés típusa
4. **Pénzügyi adatok** - Árak, energiamegtakarítás
5. **Fotók** - Kiinduló, közbeni, befejezett állapot
6. **Aláírások** - Ügyfél és kivitelező
7. **Ellenőrzés** - Adatok áttekintése
8. **Dokumentumok generálása** - DOCX fájlok letöltése

### Admin Dashboard

- **Projektek listája** - Szűrés, keresés, rendezés
- **Projekt részletek** - Adatok megtekintése, szerkesztése
- **Dokumentumok** - Generált fájlok letöltése
- **Fotó galéria** - Képek megtekintése
- **Statisztikák** - Havi összesítők, grafikonok

---

## 🗄️ API Endpoints

### Projektek
- `GET /api/projects` - Projektek listája
- `GET /api/projects/:id` - Projekt részletek
- `POST /api/projects` - Új projekt
- `PUT /api/projects/:id` - Projekt módosítás
- `DELETE /api/projects/:id` - Projekt törlés

### Dokumentumok
- `POST /api/documents/generate` - Dokumentum generálás
- `GET /api/documents/:id` - Dokumentum letöltés

### Feltöltés
- `POST /api/uploads/photo` - Fotó feltöltés
- `POST /api/uploads/signature` - Aláírás feltöltés

### Statisztikák
- `GET /api/stats/monthly` - Havi statisztikák
- `GET /api/stats/overview` - Összesítő

---

## 🧪 Tesztelés

```bash
# Backend tesztek
cd backend
npm test

# Frontend tesztek
cd frontend
npm test

# E2E tesztek
npm run test:e2e
```

---

## 📦 Production Build

```bash
# Frontend build
cd frontend
npm run build

# Backend production
cd backend
npm run start
```

---

## 🚢 Deployment

### Frontend (Netlify/Vercel)
1. Build: `npm run build` (frontend könyvtárban)
2. Deploy `dist/` mappa
3. Environment variables beállítása

### Backend (Railway/Render)
1. Connect repository
2. Environment variables beállítása
3. Auto-deploy from main branch

### Database (Supabase)
1. Új projekt létrehozása
2. SQL editor-ban schema.sql futtatás
3. Connection string másolása .env-be

---

## 📄 Dokumentum Sablonok

A `templates/` könyvtárban található DOCX fájlok placeholder-eket használnak:

- `{{customer_name}}` - Ügyfél neve
- `{{property_address_full}}` - Ingatlan címe
- `{{net_area}}` - Nettó szigetelt terület
- `{{contract_number}}` - Szerződésszám
- stb.

---

## 🔐 Környezeti Változók

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

---

## 👥 Támogatás

**BO-ZSO Hungary Kft**  
Email: lionsgatevac@gmail.com  
Cím: 2133 Sződliget HRSZ 1225/1

---

## 📝 Licenc

UNLICENSED - Proprietary Software
