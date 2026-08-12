# Assam Hazard Guard

An advanced geospatial warning dashboard and safe evacuation route planner tailored for the Assam region, India. The application integrates real-time USGS seismology feeds, Open-Meteo precipitation models, and crowdsourced citizen hazard reports. It calculates detour routes around active flood basins and translates the entire system dynamically into Assamese (অসমীয়া).

---

## 🛠️ Tech Stack & System Architecture

*   **Frontend & View Layer:** Next.js (App Router), TypeScript, Tailwind CSS, Leaflet.js
*   **Backend & Data Layer:** Next.js Route Handlers, PostgreSQL database, Prisma ORM
*   **External APIs:** USGS Earthquake Hazards Program, Open-Meteo Weather APIs, Google Gemini 1.5 Flash REST endpoint
*   **Security:** Session-based HTTP-only authentication cookies

```mermaid
graph TD
    A[Citizen / Coordinator UI] -->|Evacuation Routing / AI Advice| B[Next.js App Router Client]
    B -->|REST API Requests| C[Next.js API Routes]
    C -->|Fetch Weather / Seismic Feed| D[USGS & Open-Meteo APIs]
    C -->|Generate Custom Advisories| E[Google Gemini 1.5 Flash API]
    C -->|Query / Verify / Resolve| F[Prisma Client]
    F -->|CRUD Operations| G[(PostgreSQL Database)]
```

---

## 🧭 Core Algorithmic Engines

### 1. Dynamic Path Detour Evacuation Router
Standard navigation engines (like OSRM or Google Maps) route users through the shortest path. During monsoons, this can lead citizens directly into active flood basins. 
Our custom routing engine ([`routing-engine.ts`](file:///C:/Geostatic%20project/src/lib/routing-engine.ts)) checks if the straight-line vector between coordinates intersects active flood zones. If an intersection is found, it calculates a **repulsion offset vector** to shift the waypoint outside the flood radius:

*   **Haversine Distance Formula:**
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
    Where $\varphi$ represents Latitude, $\lambda$ represents Longitude, and $R = 6371\text{ km}$.
*   **Detour Repulsion Calculation:**
    If the distance $d_{ui}$ from a point to a flood zone $i$ is less than the flood radius $r_i$, we calculate a repulsion vector:
    $$\vec{v}_{\text{repel}} = \frac{\vec{u} - \vec{f}_i}{\|\vec{u} - \vec{f}_i\|} \times (r_i + \delta)$$
    Where $\vec{u}$ is the user position, $\vec{f}_i$ is the flood center, and $\delta = 1.5\text{ km}$ is a safety margin. This shifts the path dynamically to guide the user safely around the hazard.

---

### 2. Crowdsourced Consensus Trust Scoring Engine
To prevent false alarms and malicious warning submissions, citizen reports are processed by a consensus scoring algorithm:
1.  **Spatial Proximity Clustering:** Checks if other reports have been submitted within a $2\text{ km}$ radius in the last 2 hours.
2.  **Meteorological Correlation:** Correlates reports (like waterlogging or road blocks) with Open-Meteo precipitation forecasts for that coordinate.
3.  **Scoring Weights:**
    *   **Meteorological Index:** $+30\%$ if live rain metrics exceed $4\text{ mm/hr}$.
    *   **Proximity Consensus:** $+25\%$ per nearby report (capped at $+50\%$).
    *   **Official Verification:** $+100\%$ (Overrides logic if verified by a coordinator).
    
    Reports with a trust score below $40\%$ are marked with an **Unverified** warning indicator in the directory to alert users.

---

### 3. Active False Alert Prevention
*   **Geographical Bounding Box Checker:** Validates coordinates using administrative boundaries for Assam:
    $$24.0^{\circ}\text{N} \le \text{Latitude} \le 28.5^{\circ}\text{N}$$
    $$89.5^{\circ}\text{E} \le \text{Longitude} \le 96.5^{\circ}\text{E}$$
    Any reports placed outside these bounds are rejected at the API level.
*   **Local Rate Limiting:** Stores submission timestamps in `localStorage` to restrict users from posting more than once every 3 minutes.

---

## 🤖 Gemini AI Safety Advisory Engine
Integrates the **Google Gemini 1.5 Flash** REST API to generate real-time, localized safety guidelines.
*   **Structured Prompts:** Sends the hazard type, coordinates, and resources of the nearest relief camp (e.g. food/medicine levels).
*   **Dynamic Response Output:** Returns threat analyses, packing checklists tailored to camp shortages, and coordinator logistics.
*   **Language Adaptation:** Responses render in Assamese or English depending on the user's active session language.
*   **Local Fallback:** Falls back to rules-based template rendering if the API key is not configured, ensuring the demo works in any environment.

---

## 🌐 Dynamic Localization Architecture
*   **Client Context:** A custom React context provider ([`LanguageContext.tsx`](file:///C:/Geostatic%20project/src/context/LanguageContext.tsx)) manages the UI language state and caches selections in `localStorage`.
*   **Server Component Synchronization:** Server-rendered pages (like the `/history` directory) cannot read client context. To synchronize translations, the client provider sets a browser cookie `lang=as` or `lang=en`. Server Components read this cookie directly from HTTP request headers using `cookies()` to translate SQL queries and tables server-side.

---

## 🗄️ Database Schema (Prisma & PostgreSQL)

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // SHA-256 hashed password
  role      String   @default("coordinator")
}

model CitizenAlert {
  id          String   @id @default(uuid())
  category    String   // waterlogging, road_closure, pothole, etc.
  description String
  latitude    Float
  longitude   Float
  verified    Boolean  @default(false)
  resolved    Boolean  @default(false)
  trustScore  Int      @default(30)
  createdAt   DateTime @default(now())
}
```

---

## 📡 API Endpoints Spec

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/warnings` | Fetches USGS feeds, Open-Meteo data, and active Postgres citizen logs. | No |
| **POST**| `/api/alerts` | Creates a new citizen report with geofence validation. | No |
| **PATCH**| `/api/alerts` | Verifies or marks a citizen report as resolved. | Yes (Coordinator cookie) |
| **POST**| `/api/advisory` | Generates Gemini AI safety instructions for a hazard. | No |
| **POST**| `/api/auth/login` | Validates coordinator logins and sets session cookies. | No |

---

## 🚀 Installation & Local Setup

1.  **Clone the Repository & Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables (`.env`):**
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/geostatic_db?schema=public"
    GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
    ```
3.  **Run Database Migrations:**
    ```bash
    npx prisma db push
    ```
4.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the console.
