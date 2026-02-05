# Project Roadmap: Setup and Run

This repository contains two apps:

- **Backend**: FastAPI + Uvicorn + SQLAlchemy + Alembic
- **Mobile**: Expo / React Native

Follow the steps below to set up and run locally on Windows.

## Prerequisites

- Python 3.10+
- Node.js 18+ (recommend LTS) and npm 9+
- Git

Optional but recommended:

- VS Code with Python and React Native extensions
- Android Studio (for Android emulator) or Xcode (macOS only) for iOS
- Expo Go app on your phone (for quick testing)

## 1) Backend (FastAPI)

### Setup

1. Open a terminal in `backend/`.
2. Create and activate a virtual environment:

   ```bat
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bat
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Environment variables:

   - Copy or create `.env` in `backend/` (contact the team for the required keys/values).
   - Typical values include database URL and JWT/secret keys.

5. Database setup (if using a relational DB):

   - Create the database your app expects.
   - Apply migrations (migrations are ignored in Git; ensure you have the migration scripts locally if needed):

     ```bat
     alembic upgrade head
     ```

### Run

- Quick start (provided script):

  ```bat
  start.bat
  ```

- Or run manually:

  ```bat
  .venv\Scripts\activate
  python run.py
  ```

- The server prints your LAN URL, e.g. `http://<your-ip>:8000`.
- Health check: `GET /` should return `{ "status": "ok" }`.

## 2) Mobile (Expo / React Native)

### Setup

1. Open a terminal in `mobile/`.
2. Install dependencies:

   ```bat
   npm install
   ```

3. Configure API base URL:

   - Edit `mobile/config.js` to point to your backend URL (e.g. `http://<your-ip>:8000`).

### Run

- Start the Expo dev server:

  ```bat
  npm run start
  ```

- To open specific platforms:

  ```bat
  npm run android
  npm run ios     (macOS only)
  npm run web
  ```

- With the Expo QR, open the app on a device running Expo Go.

## Troubleshooting

- If the mobile app cannot reach the backend:
  - Ensure both are on the same network.
  - Use your local IPv4 shown by the backend (not `localhost`) in `mobile/config.js`.
  - Allow the Python/Uvicorn process through Windows Firewall.
- If `requirements.txt` install fails:
  - Ensure the correct Python version (3.10+).
  - Upgrade pip and retry: `python -m pip install --upgrade pip`.
- If `alembic` isn’t found:
  - Activate the venv and install: `pip install alembic`.
- If Android build/launch fails:
  - Ensure Android Studio SDK/emulator is installed, or test with a physical device.

## Notes

- Git is configured to ignore common build artifacts, local environments, Expo caches, and Alembic migration versions.
- Commit only source files and configuration that are safe to share.
