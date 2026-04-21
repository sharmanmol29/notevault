# NoteVault

Secure, AI-powered note-taking app with a Spring Boot API and a React (Vite + TypeScript) PWA.

## Repository layout

- `backend/` — Spring Boot 3.2 (Java 17) + MySQL + JWT + Google OAuth2 + Gemini
- `notevault-frontend/` — React + Vite + Tailwind + Dexie + PWA

## Backend setup

1. Create the MySQL database:

```bash
mysql -u root -p -e "CREATE DATABASE notevault;"
```

2. Copy environment variables from `/.env.example` and export them (examples below use bash; adapt for PowerShell as needed).

```bash
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=BASE64_ENCODED_SECRET_AT_LEAST_64_BYTES_FOR_HS512
export AES_SECRET_KEY=32_or_more_characters_ok
export GEMINI_API_KEY=your-gemini-api-key
export GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. Run the API:

```bash
cd backend
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

### Google OAuth notes

- In Google Cloud Console, add an authorized redirect URI matching Spring Security’s default: `http://localhost:8080/login/oauth2/code/google`
- The SPA starts Google sign-in by navigating to `http://localhost:8080/oauth2/authorization/google`

## Frontend setup

```bash
cd notevault-frontend
cp .env.example .env
npm install
npm run dev
```

The UI listens on `http://localhost:5173`.

## Access

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Health: `http://localhost:8080/actuator/health`
