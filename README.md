# SehatSetu

**"Healthcare guidance, closer to you."**

SehatSetu is a comprehensive, non-diagnostic digital healthcare assistance platform designed primarily to serve rural and remote populations. The platform breaks down traditional barriers to healthcare access by providing essential health information, locating nearby medical facilities, managing appointments, setting health reminders, and offering immediate access to emergency contacts. 

To bridge the digital literacy gap, SehatSetu natively integrates **Multilingual Support** and a **Voice Navigation Interface**, ensuring that technology serves as an enabler rather than an obstacle for users of all backgrounds.

---

## 🌟 Key Features

### 🗣️ Multilingual Support (i18n)
Built with inclusivity in mind, the platform uses `i18next` and `react-i18next` to offer full multilingual support.
- **Current Languages:** English and Hindi.
- **Extensible:** The architecture is designed to easily onboard regional dialects and additional languages using JSON-based translation dictionaries.
- **Context-Aware:** Translations adapt to user context, ensuring that medical terms and UI elements are clearly understood by rural users.

### 🎙️ Voice Navigation Interface
To assist users with limited digital literacy or physical impairments, SehatSetu includes an integrated voice assistant.
- **Browser-Based Speech Recognition:** Allows users to navigate the app, search for hospitals, or query basic health info using their voice.
- **Hands-Free Access:** Critical for users who may struggle with typing on mobile devices.
- **Seamless Integration:** Works synchronously with the multilingual features, understanding localized inputs.

### 🏥 Healthcare Locator (Find Care)
- **Geospatial Search:** Interactive maps powered by `react-leaflet` to visualize nearby hospitals, clinics, and pharmacies.
- **Robust Data Integration:** Merges verified SehatSetu partner facilities with live data via **LeapLeaf OpenSatellite API**.
- **Offline Resilience:** Employs exponential backoff and fallback to the **Overpass API (OpenStreetMap)** to guarantee high availability even during API disruptions.

### 📅 Appointments & Records
- **Seamless Booking:** Patients can request appointments with partner hospitals directly from the app.
- **Document Management:** Securely upload, store, and manage health documents and prescriptions.

### 🔔 Health Reminders & Offline PWA
- **Medicine Alerts:** Scheduled reminders for medication and upcoming appointments.
- **Progressive Web App (PWA):** Features service worker caching (via `vite-plugin-pwa`) to ensure core functionalities remain accessible offline or in low-bandwidth environments.

---

## 🛠️ Tech Stack

### Frontend (Client-Side)
- **Framework:** React.js (v19) via Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Maps:** Leaflet & React-Leaflet
- **Localization:** i18next
- **State & API:** Axios, js-cookie
- **PWA:** vite-plugin-pwa

### Backend (Server-Side)
- **Framework:** Python (FastAPI)
- **Database:** PostgreSQL
- **ORM & Migrations:** SQLAlchemy, asyncpg, Alembic
- **Security:** bcrypt (password hashing), JWT (Authentication)
- **Server:** Uvicorn

---

## 🚀 Getting Started

### Prerequisites
Before running the application, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **PostgreSQL** (Running locally or via Docker)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   .\venv\Scripts\Activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Database Configuration:
   Ensure PostgreSQL is running on port `5432` with the password `EventAdmin1234` (or update the connection string in your `.env` file).
5. Initialize the database and run migrations:
   ```bash
   python create_db.py
   alembic upgrade head
   python seed_db.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend API will be running at `http://localhost:8000`. API Documentation is available at `/docs`.*

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be running at `http://localhost:5173`.*

---

## 🔑 Demo Credentials

The backend seeding script (`seed_db.py`) automatically generates the following demo accounts for testing purposes:

- **Patient Portal:**
  - Phone: `8888888888`
  - Password: `Demo@123`

- **Admin/Hospital Portal:**
  - Phone: `9999999999`
  - Password: `Demo@123`

---

## 🌍 External Integrations Configuration

### LeapLeaf OpenSatellite API (Find Care)
SehatSetu integrates with the LeapLeaf API to fetch live healthcare Points of Interest (POIs). Configure the integration by setting the following in `backend/.env`:
```ini
LEAPLEAF_API_KEY=your_api_key_here
LEAPLEAF_BASE_URL=https://api.leapleaf.example.com
```

**Fallback Mechanism:** 
If the API key is missing or the service experiences downtime, the backend automatically fails over to the OpenStreetMap (Overpass) API. This ensures users are never left without vital healthcare facility data. External data is merged seamlessly with local partner data at the backend level, keeping API keys secure and the frontend experience uninterrupted.

---

*Disclaimer: SehatSetu provides non-diagnostic health information and guidance. It is not a replacement for professional medical advice, diagnosis, or treatment.*
