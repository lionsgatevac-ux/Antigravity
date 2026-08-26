# 📋 Padlásfödém Szigetelés – Projekt Összefoglaló

## Új fejlesztőknek szánt bevezető dokumentum

> **Utolsó frissítés:** 2026. április 3.  
> **Fejlesztő cég:** BO-ZSO Hungary Kft. | **AI asszisztens:** Antigravity (Google DeepMind)

---

## 🎯 Mi ez az alkalmazás?

Egy **belső webalkalmazás** padlásfödém szigetelési projektek teljes körű kezelésére. A rendszer kezeli:

- Ügyféladatokat és projekteket nyilvántartása
- 5 féle jogi/műszaki dokumentum automatikus generálását (DOCX → PDF)
- Digitális aláírásokat (helyszíni tablet + remote email link)
- Anyagkészlet és kiadás nyilvántartást
- Több felhasználó / szervezeti jogosultságkezelést

A rendszer **61 aktív projektet** kezel jelenleg (2026 eleje óta, `BOZSO-2026-0101`-től).

---

## 🏗️ Technológiai stack

| Réteg | Technológia |
| --- | --- |
| **Frontend** | React 18 + Vite, vanilla CSS |
| **Backend** | Node.js + Express.js |
| **Adatbázis** | PostgreSQL via **Supabase** |
| **Fájltár** | **Supabase Storage** (képek, dokumentumok) |
| **PDF/DOCX generálás** | `docxtemplater` + `puppeteer` (Chromium) |
| **Email** | Nodemailer (SMTP – konfigurálható az admin felületen) |
| **Deploy** | **Google Cloud Run** (Docker konténer) |
| **Autentikáció** | JWT token (saját implementáció, nem Supabase Auth) |

---

## 📁 Mappastruktúra

```text
Padlás födém szigetelés dokumentum managment/
│
├── backend/                    ← Node.js API szerver
│   ├── server.js               ← Belépési pont, Express app, portok, route-ok
│   ├── routes/                 ← API végpontok
│   │   ├── auth.js             ← Login, register, invite, JWT generálás
│   │   ├── projects.js         ← Projektek CRUD (legnagyobb fájl ~45KB!)
│   │   ├── documents.js        ← Dokumentum generálás, letöltés
│   │   ├── uploads.js          ← Fotók feltöltése (Supabase Storage)
│   │   ├── remote.js           ← Távoli aláírás token kezelés
│   │   ├── inventory.js        ← Anyagkészlet kezelés
│   │   ├── materials.js        ← Anyagtípusok CRUD
│   │   ├── customers.js        ← Ügyfelek
│   │   ├── stats.js            ← Statisztikák
│   │   ├── adminRoutes.js      ← Admin funkciók
│   │   └── public.js           ← Publikus végpontok (lead form)
│   │
│   ├── services/               ← Üzleti logika
│   │   ├── documentGenerator.js ← ⭐ A legfontosabb service! DOCX template kitöltés + PDF generálás
│   │   ├── emailService.js     ← Email küldés (aláírási felkérések, értesítések)
│   │   ├── calculations.js     ← Műszaki számítások (területek, energiamegtakarítás)
│   │   ├── supabaseStorage.js  ← Supabase Storage helper
│   │   └── aiService.js        ← OpenRouter AI integráció
│   │
│   ├── middleware/
│   │   └── errorHandler.js     ← Globális hibakezelő
│   │
│   ├── config/
│   │   └── database.js         ← PostgreSQL kapcsolat (pg library)
│   │
│   └── .env                    ← Titkos kulcsok (NEM commitolni!)
│
├── frontend/                   ← React SPA
│   └── src/
│       ├── App.jsx             ← Router, route-ok felsorolása
│       ├── pages/              ← Oldalak (minden route egy oldal)
│       │   ├── NewProject.jsx      ← Új projekt létrehozása (~60KB, a legkomplexebb!)
│       │   ├── EditProject.jsx     ← Projekt szerkesztése (~62KB)
│       │   ├── ProjectList.jsx     ← Projektlista
│       │   ├── ProjectDetails.jsx  ← Projekt részletek, dokumentumok
│       │   ├── RemoteSign.jsx      ← Távoli aláírás (publikus, token alapú)
│       │   ├── Inventory.jsx       ← Anyagkészlet kezelő
│       │   ├── AdminDashboard.jsx  ← Admin panel
│       │   ├── LeadForm.jsx        ← Publikus ajánlatkérő űrlap (/ajanlatkeres)
│       │   └── ...
│       ├── components/         ← Újrafelhasználható komponensek
│       ├── contexts/           ← AuthContext (JWT token tárolás)
│       └── services/           ← API hívások (fetch wrapper-ek)
│
├── templates/                  ← DOCX sablonok (5 dokumentumtípus)
├── migrations/                 ← SQL migrációk
├── Dockerfile                  ← Docker build konfiguráció
├── DEPLOY_ANTIGRAVITY.bat      ← Egyszerű deploy script (Windows)
└── .env                        ← Gyökér szintű env (frontend build-hez)
```

---

## 🗄️ Adatbázis struktúra

**Supabase projekt URL:** `https://pkjohziwbiiyzyospuot.supabase.co`

```text
projects          ← Projekt alapadatok (contract_number, status, aláírás mezők)
    ↓ (project_details.project_id)
project_details   ← Műszaki + pénzügyi adatok (területek, összegek, dátumok)
    ↓                          ↓
customers         ← Ügyfél     properties         ← Ingatlan adatai
  (full_name,                    (cím, épület típus,
   email, telefon)               fűtési mód, tető)

photos            ← Fotódokumentáció (Supabase Storage URL-ek)
documents         ← Generált DOCX fájlok metaadatai
materials         ← Anyagtípusok (EPS, ásványgyapot, stb.)
material_transactions ← Anyagkiadások, készletmozgások
users             ← Belső felhasználók (admin, kivitelező)
organizations     ← Szervezetek (multi-tenant)
```

### Projekt státuszok

- `draft` → `in_progress` → `completed` → `signed`

### Projekt számozás

- Formátum: `BOZSO-2026-XXXX` (pl. `BOZSO-2026-0101`)

---

## 📄 Dokumentum generálás – hogyan működik?

Ez a rendszer **lelke**! A `documentGenerator.js` service végzi:

1. **5 dokumentumtípus** generálható minden projekthez:
   - `kivitelezesi_szerzodes` – Kivitelezési szerződés
   - `atadas_atveteli` – Átadás-átvételi jegyzőkönyv
   - `kivitelezoi_nyilatkozat` – Kivitelezői nyilatkozat
   - `megallapodas_hem` – HEM megállapodás
   - `tamogatas_igenylo` – Támogatás igénylő

2. **Folyamat:**
   - DOCX sablon betöltése (`/templates/` mappából)
   - `docxtemplater` kitölti az `{{{TAG}}}` helyőrzőket az adatbázisból
   - Képek (alaprajz, aláírások) beillesztése a dokumentumba
   - `cheerio` HTML sanitizáló futtatása (felesleges szakaszok eltávolítása)
   - PDF generálás `puppeteer` (headless Chromium) segítségével
   - Fájl feltöltése Supabase Storage-ba

3. **Sablon tagek** mintái: `{{{ugyfel_nev}}}`, `{{{cim}}}`, `{{{projekt_szam}}}`, stb.

---

## ✍️ Aláírási folyamat

### Helyszíni aláírás

- Tablet/mobil böngészőn a `ProjectDetails` oldalon
- Canvas alapú aláírás pad
- Base64 PNG → Supabase Storage → dokumentumba beillesztve

### Távoli aláírás (email)

1. Admin "Email küldés ügyfélnek" gomb → `emailService.js` küld emailt
2. Email tartalmaz egy egyedi linket: `https://[APP_URL]/sign/[TOKEN]`
3. Az ügyfél megnyitja → `RemoteSign.jsx` oldal
4. Token validálás: `routes/remote.js` → adatbázisban ellenőrzi az expiry-t
5. Ügyfél aláír → Base64 mentés → projekt `signed` státuszra vált

---

## ☁️ Deploy folyamat

**Platform:** Google Cloud Run (eu-west régió)

**Aktív szolgáltatások:**

| Szolgáltatás | URL |
| --- | --- |
| Backend + Frontend (eu-west1) | `https://padlas-fodem-szigeteles-wccgabnluq-ew.a.run.app` |
| Elsődleges (eu-west4) | `https://padlas-fodem-szigeteles-wccgabnluq-ey.a.run.app` |
| Régebbi app (eu-west4) | `https://padlas-szigeteles-app-wccgabnluq-ey.a.run.app` |

**Deploy lépések (egyszerűsítve):**

```bash
# 1. Frontend build
cd frontend && npm run build

# 2. Docker image build + push
gcloud builds submit --tag gcr.io/[PROJECT]/padlas-fodem-szigeteles

# 3. Cloud Run deploy
gcloud run deploy padlas-fodem-szigeteles --image gcr.io/[PROJECT]/padlas-fodem-szigeteles
```

> Kényelmes: `DEPLOY_ANTIGRAVITY.bat` – egyetlen kattintással elvégzi a teljes deploy-t

**Fontos:** A frontend `dist/` mappa be van MÁSOLVA a Docker image-be (nem a konténerben buildel).

---

## 🔐 Környezeti változók

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://...   ← Supabase Postgres direct connection
SUPABASE_URL=https://pkjohziwbiiyzyospuot.supabase.co
SUPABASE_ANON_KEY=eyJ...        ← Publikus anon kulcs
JWT_SECRET=...                  ← JWT aláírási titok
NODE_ENV=development/production
PORT=4000                       ← Lokálisan 4000, Cloud Run-on 8080
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000   ← Lokálisan, prod-ban üres (same-origin)
```

---

## 🖥️ Lokális fejlesztés

```bash
# Backend indítása (port: 4000)
cd backend
npm run dev       # nodemon-nal (automatikus újraindítás)

# Frontend indítása (port: 5173)
cd frontend
npm run dev       # Vite dev server

# Vagy egyben:
start_dev.bat     ← Mindkettőt egyszerre indítja
```

**API hívások fejlesztésben:** A Vite proxy továbbítja a `/api/*` kéréseket a `localhost:4000`-re.

---

## 👥 Felhasználói szerepkörök

| Szerepkör | Leírás |
| --- | --- |
| `admin` | Teljes hozzáférés, felhasználókezelés, email beállítások |
| `contractor` | Projektlétrehozás, szerkesztés, dokumentumgenerálás |

**Meghívó rendszer:** Admin meghív emailcímre → token generálás → `/accept-invite` oldalon regisztrál.

---

## 📦 Fontosabb NPM csomagok

| Csomag | Mire való |
| --- | --- |
| `docxtemplater` | DOCX sablonok kitöltése |
| `pizzip` | DOCX (ZIP) fájlkezelés |
| `puppeteer` | PDF generálás headless Chrome-mal |
| `@supabase/supabase-js` | Supabase kliens (Storage + DB) |
| `pg` | PostgreSQL direkt kapcsolat |
| `jsonwebtoken` | JWT autentikáció |
| `nodemailer` | Email küldés |
| `multer` | Fájlfeltöltés kezelés |
| `cheerio` | HTML manipulálás (PDF sanitizálás) |
| `exceljs` | Excel export funkciók |
| `bcrypt` | Jelszó hashelés |

---

## ⚠️ Ismert quirks & fontos tudnivalók

1. **`projects.js` route ~45KB** – a legnagyobb és legkomplexebb fájl, körültekintéssel szerkeszteni!
2. **DOCX tag-ek töredezhetnek** – a Word XML-je néha szétszedi a `{{{TAG}}}` tageket több XML elem közé. Ha egy tag nem töltődik ki, a `repair_fractured_tags.js` scriptek segíthetnek.
3. **Supabase RLS** – Row Level Security engedélyezett minden táblán. Ha egy query 0 sort ad vissza, ellenőrizd az RLS policy-kat!
4. **Multi-tenant** – az `organization_id` mező szűri a hozzáférést. Minden projekthez és felhasználóhoz tartozik egy szervezet.
5. **Cloud Run stateless** – a konténer nem tárol lokális fájlokat tartósan! Minden generált fájt Supabase Storage-ba kell menteni.
6. **Frontend build szükséges deploy előtt** – a Dockerfile másolja a `frontend/dist`-et, ezért `npm run build` szükséges módosítás után.
7. **Kettős adatbázis kapcsolat** – a rendszer egyszerre használja a `pg` könyvtárat (direkt PostgreSQL) ÉS a `@supabase/supabase-js`-t (Storage + egyes lekérdezések).

---

## 🔧 Hasznos debug scriptek (gyökér és backend mappában)

A projektben sok egyszeri debug script van felhalmozódva. Ezek **nem részei az appnak**, csak fejlesztési eszközök:

- `check_*.js` → adatbázis/séma ellenőrzések
- `debug_*.js` → hibakeresési scriptek
- `fix_*.js` → adatjavítási one-shot scriptek
- `verify_*.js` → deploy utáni ellenőrzések
- `insert_*.js` → manuális adatbevitel scriptek

---

## 📞 Kapcsolat

- **Fejlesztési AI:** Antigravity (Google DeepMind) – a projekt fejlesztőasszisztense
- **Ügyfél:** BO-ZSO Hungary Kft.
