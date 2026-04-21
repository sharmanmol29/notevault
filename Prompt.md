# NoteVault — Full-Stack Production App: Complete Cursor AI Generation Prompt

> **INSTRUCTIONS FOR CURSOR**: Generate EVERY file listed in this prompt. Do NOT skip any file, do NOT leave any TODO or placeholder, do NOT use mock data. Every API must be wired end-to-end. The project must run without errors after setup.

---

## 📌 PROJECT OVERVIEW

**Project Name**: NoteVault  
**Tagline**: *Where your ideas stay truly yours.*  
**Type**: Secure, AI-powered note-taking PWA  
**Architecture**: Spring Boot (Java 17) backend + React + Vite + TypeScript frontend  
**Database**: MySQL  

### Core Capabilities
- JWT-based auth (access + refresh tokens)
- Google OAuth 2.0 login
- AES-256 encrypted notes stored in MySQL
- Hierarchical folder system
- Recycle Bin with 30-day auto-deletion
- AI features via Gemini API (summarize, tag, improve, RAG Q&A)
- PWA with offline-first support via Dexie.js + Workbox
- Audit logging for all critical actions
- Dark/light theme toggle with localStorage persistence

> ❌ DO NOT implement OTP, 2FA, SMS verification, or phone number fields anywhere.

---

## 🗂️ PHASE 1 — BACKEND: Auth, OAuth, JWT

### 1.1 Project Setup

Create a Maven project with the following `pom.xml` dependencies:

```xml
<dependencies>
  <!-- Spring Boot Starters -->
  <dependency>spring-boot-starter-web</dependency>
  <dependency>spring-boot-starter-security</dependency>
  <dependency>spring-boot-starter-data-jpa</dependency>
  <dependency>spring-boot-starter-validation</dependency>
  <dependency>spring-boot-starter-webflux</dependency> <!-- for WebClient / Gemini -->
  <dependency>spring-boot-starter-actuator</dependency>

  <!-- JWT -->
  <dependency>io.jsonwebtoken:jjwt-api:0.11.5</dependency>
  <dependency>io.jsonwebtoken:jjwt-impl:0.11.5</dependency>
  <dependency>io.jsonwebtoken:jjwt-jackson:0.11.5</dependency>

  <!-- Google OAuth2 -->
  <dependency>spring-boot-starter-oauth2-client</dependency>
  <dependency>com.google.api-client:google-api-client:2.2.0</dependency>

  <!-- MySQL -->
  <dependency>mysql-connector-j</dependency>

  <!-- Lombok -->
  <dependency>org.projectlombok:lombok</dependency>

  <!-- MapStruct -->
  <dependency>org.mapstruct:mapstruct:1.5.5.Final</dependency>

  <!-- Scheduling -->
  <dependency>spring-boot-starter-quartz</dependency>
</dependencies>
```

Java version: 17. Spring Boot version: 3.2.x.

---

### 1.2 `application.properties`

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/notevault?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
jwt.secret=${JWT_SECRET}
jwt.access-token-expiry=900000
jwt.refresh-token-expiry=604800000

# Google OAuth
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/api/auth/oauth2/callback/google
spring.security.oauth2.client.registration.google.scope=email,profile

# AES Encryption
aes.secret=${AES_SECRET_KEY}

# Gemini
gemini.api.key=${GEMINI_API_KEY}
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Frontend URL (for CORS and redirect)
app.frontend.url=http://localhost:5173

# Recycle bin auto-delete scheduler
recycle.bin.auto-delete.days=30
```

Create a `.env.example` at project root documenting all required environment variables.

---

### 1.3 Package Structure

```
com.notevault
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── WebClientConfig.java
│   └── AesConfig.java
├── controller/
│   ├── AuthController.java
│   ├── NoteController.java
│   ├── FolderController.java
│   ├── RecycleBinController.java
│   ├── AiController.java
│   ├── SyncController.java
│   └── AuditController.java
├── service/
│   ├── AuthService.java
│   ├── NoteService.java
│   ├── FolderService.java
│   ├── RecycleBinService.java
│   ├── AiService.java
│   ├── SyncService.java
│   ├── AuditService.java
│   └── EncryptionService.java
├── repository/
│   ├── UserRepository.java
│   ├── NoteRepository.java
│   ├── FolderRepository.java
│   ├── RefreshTokenRepository.java
│   └── AuditLogRepository.java
├── entity/
│   ├── User.java
│   ├── Note.java
│   ├── Folder.java
│   ├── RefreshToken.java
│   └── AuditLog.java
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── NoteRequest.java
│   │   ├── FolderRequest.java
│   │   └── AiRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── NoteResponse.java
│       ├── FolderResponse.java
│       ├── AiResponse.java
│       └── SyncResponse.java
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   ├── CustomUserDetailsService.java
│   ├── OAuth2AuthenticationSuccessHandler.java
│   └── OAuth2UserService.java
├── scheduler/
│   └── RecycleBinScheduler.java
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   └── UnauthorizedException.java
└── util/
    └── AesEncryptionUtil.java
```

---

### 1.4 Entities

#### `User.java`
```java
@Entity @Table(name = "users") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password; // nullable for OAuth users

    @Enumerated(EnumType.STRING)
    private AuthProvider provider; // LOCAL, GOOGLE

    private String providerId;

    @Column(nullable = false)
    private boolean enabled = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

#### `Note.java`
```java
@Entity @Table(name = "notes") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Note {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title; // stored in plaintext for search
    
    @Column(columnDefinition = "TEXT")
    private String encryptedContent; // AES-256 encrypted

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    private boolean deleted = false;
    private LocalDateTime deletedAt;
    private int wordCount = 0;

    @ElementCollection
    @CollectionTable(name = "note_tags")
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

#### `Folder.java`
```java
@Entity @Table(name = "folders") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Folder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Folder parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Folder> children = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

#### `RefreshToken.java`
```java
@Entity @Table(name = "refresh_tokens") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;
}
```

#### `AuditLog.java`
```java
@Entity @Table(name = "audit_logs") @Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String action; // CREATE_NOTE, DELETE_NOTE, LOGIN, etc.
    private String resourceType;
    private Long resourceId;
    private String ipAddress;
    
    @CreationTimestamp
    private LocalDateTime timestamp;
}
```

---

### 1.5 Security Layer

#### `JwtTokenProvider.java`
- Generate access tokens (15 min expiry) signed with HS512
- Generate refresh tokens (7 day expiry) signed with HS512
- Methods: `generateAccessToken(UserDetails)`, `generateRefreshToken(UserDetails)`, `validateToken(String)`, `getUsernameFromToken(String)`
- Use `Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtSecret))`

#### `JwtAuthenticationFilter.java`
- Extends `OncePerRequestFilter`
- Extract Bearer token from `Authorization` header
- Validate and set `SecurityContextHolder` authentication
- Skip if token invalid (don't throw, just let request through unauthenticated)

#### `SecurityConfig.java`
- Permit: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/oauth2/**`, `/actuator/health`
- Authenticate all other `/api/**` routes
- Configure CORS to allow `http://localhost:5173`
- Register `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
- Register `OAuth2UserService` and `OAuth2AuthenticationSuccessHandler`
- Set session management to STATELESS

#### `OAuth2UserService.java`
- Implements `DefaultOAuth2UserService`
- On `loadUser`: extract email and name from Google attributes
- Find or create User entity with `provider=GOOGLE`
- Return a `CustomOAuth2User` wrapping the User

#### `OAuth2AuthenticationSuccessHandler.java`
- On success: generate JWT access + refresh tokens
- Redirect to `${app.frontend.url}/oauth2/callback?token={accessToken}&refreshToken={refreshToken}`

---

### 1.6 Auth Controller & Service

#### `POST /api/auth/register`
Request: `{ name, email, password }`  
- Validate email uniqueness
- Hash password with BCrypt
- Save user with `provider=LOCAL`
- Return `AuthResponse { accessToken, refreshToken, user: { id, name, email } }`

#### `POST /api/auth/login`
Request: `{ email, password }`  
- Validate credentials
- Generate access + refresh tokens
- Log `LOGIN` audit event
- Return `AuthResponse`

#### `POST /api/auth/refresh`
Request: `{ refreshToken }`  
- Validate refresh token exists in DB and not expired
- Generate new access token
- Return `{ accessToken }`

#### `POST /api/auth/logout`
- Delete refresh token from DB
- Return 200 OK

#### `GET /api/auth/me`
- Return current authenticated user profile

---

### 1.7 Encryption Service

#### `AesEncryptionUtil.java`
- Algorithm: AES/GCM/NoPadding
- Key: 256-bit derived from `aes.secret` property via `SecretKeySpec`
- IV: Random 12-byte IV prepended to ciphertext
- `encrypt(String plaintext): String` — returns Base64(iv + ciphertext)
- `decrypt(String ciphertext): String` — splits IV, decrypts

All note content must pass through this service before persistence and after retrieval.

---

## 🗂️ PHASE 2 — BACKEND FEATURES

### 2.1 Note Controller & Service (`/api/notes`)

#### Endpoints:
- `GET /api/notes` — Get all non-deleted notes for current user (decrypt content before returning)
- `GET /api/notes/{id}` — Get single note (decrypt)
- `POST /api/notes` — Create note (encrypt content, set wordCount)
- `PUT /api/notes/{id}` — Update note (encrypt new content)
- `DELETE /api/notes/{id}` — Soft delete (set deleted=true, deletedAt=now)
- `GET /api/notes/search?q={query}` — MySQL LIKE search on title + decrypted content (use fulltext index on title)

**NoteResponse DTO**: `{ id, title, decryptedContent, folderId, folderName, tags, wordCount, createdAt, updatedAt, deleted }`

All note service methods must log audit events.

---

### 2.2 Folder Controller & Service (`/api/folders`)

#### Endpoints:
- `GET /api/folders` — Get entire folder tree for current user (recursive, return as tree structure)
- `POST /api/folders` — Create folder `{ name, parentId? }`
- `PUT /api/folders/{id}` — Rename folder
- `DELETE /api/folders/{id}` — Delete folder (move notes to root, delete subfolders recursively)

**FolderResponse DTO**: `{ id, name, parentId, children: [...], noteCount, createdAt }`

---

### 2.3 Recycle Bin Controller & Service (`/api/recycle-bin`)

#### Endpoints:
- `GET /api/recycle-bin` — Get all soft-deleted notes for user
- `PUT /api/recycle-bin/{id}/restore` — Restore note (set deleted=false, deletedAt=null)
- `DELETE /api/recycle-bin/{id}` — Hard delete note permanently
- `DELETE /api/recycle-bin/empty` — Hard delete all soft-deleted notes for user

#### `RecycleBinScheduler.java`
- `@Scheduled(cron = "0 0 2 * * ?")` — runs at 2 AM daily
- Hard delete all notes where `deleted=true` AND `deletedAt < now - 30 days`

---

### 2.4 AI Controller & Service (`/api/ai`)

Uses Gemini API via `WebClient`.

#### Endpoints:
- `POST /api/ai/summarize` — `{ noteId }` → return summary string
- `POST /api/ai/generate-tags` — `{ noteId }` → return `{ tags: string[] }`
- `POST /api/ai/improve` — `{ noteId }` → return improved content string
- `POST /api/ai/ask` — `{ question, noteIds: [] }` → RAG: decrypt note contents, build context, ask Gemini, return answer

#### `AiService.java`
- `WebClient` bean injected
- Build Gemini request payload: `{ contents: [{ parts: [{ text: prompt }] }] }`
- Parse response from `candidates[0].content.parts[0].text`
- Handle errors gracefully (return descriptive error message)

---

### 2.5 Sync Controller (`/api/sync`)

#### `GET /api/sync?since={timestamp}`
- Returns all notes updated after `since` timestamp for current user
- Also returns list of soft-deleted note IDs since that timestamp
- Response: `{ updated: [NoteResponse], deletedIds: [Long], serverTime: Instant }`

---

### 2.6 Audit Controller (`/api/audit`)

#### `GET /api/audit?page=0&size=20`
- Paginated audit logs for current user
- Response: Page of `{ action, resourceType, resourceId, timestamp, ipAddress }`

---

### 2.7 Global Exception Handler

`GlobalExceptionHandler.java` — `@RestControllerAdvice`:
- `ResourceNotFoundException` → 404
- `UnauthorizedException` → 401
- `MethodArgumentNotValidException` → 400 with field errors
- `Exception` → 500 with generic message

All error responses: `{ timestamp, status, error, message, path }`

---

## 🗂️ PHASE 3 — FRONTEND CORE UI + THEME

### 3.1 Vite + React + TypeScript Project Setup

```bash
npm create vite@latest notevault-frontend -- --template react-ts
cd notevault-frontend
npm install tailwindcss postcss autoprefixer
npm install zustand react-router-dom axios
npm install dexie dexie-react-hooks
npm install workbox-webpack-plugin vite-plugin-pwa
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-highlight @tiptap/extension-code-block
npm install react-hot-toast
npm install lucide-react
npm install date-fns
```

---

### 3.2 Tailwind Configuration (`tailwind.config.ts`)

```ts
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          text: '#E2E8F0',
          muted: '#64748B',
        },
        light: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#0F172A',
          muted: '#94A3B8',
        },
        accent: {
          blue: '#3B82F6',
          green: '#22C55E',
          purple: '#6366F1',
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'skeleton-pulse': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: []
}
```

Import `Sora` and `JetBrains Mono` from Google Fonts in `index.html`.

---

### 3.3 Theme Store (`src/store/themeStore.ts`)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: true,
      toggle: () => set((s) => {
        const next = !s.isDark
        document.documentElement.classList.toggle('dark', next)
        return { isDark: next }
      }),
    }),
    { name: 'notevault-theme' }
  )
)
```

In `main.tsx`: on app boot, read `isDark` from localStorage and apply `dark` class to `document.documentElement` immediately before React renders (prevents flash).

---

### 3.4 Auth Store (`src/store/authStore.ts`)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: number; name: string; email: string }

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'notevault-auth' }
  )
)
```

---

### 3.5 Notes Store (`src/store/notesStore.ts`)

```ts
import { create } from 'zustand'
import { Note } from '../types'

interface NotesStore {
  notes: Note[]
  activeNoteId: number | null
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  removeNote: (id: number) => void
  setActiveNote: (id: number | null) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  activeNoteId: null,
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (note) => set((s) => ({ notes: s.notes.map(n => n.id === note.id ? note : n) })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter(n => n.id !== id) })),
  setActiveNote: (id) => set({ activeNoteId: id }),
}))
```

Also create `folderStore.ts` with similar pattern for folders.

---

### 3.6 Axios Instance (`src/api/axiosInstance.ts`)

```ts
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080' })

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: refresh token on 401
let isRefreshing = false
let failedQueue: any[] = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          data.accessToken,
          refreshToken!
        )
        failedQueue.forEach(p => p.resolve(data.accessToken))
        failedQueue = []
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        failedQueue.forEach(p => p.reject(error))
        failedQueue = []
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

---

### 3.7 API Service Files

Create these files in `src/api/`:

**`authApi.ts`**: `login()`, `register()`, `logout()`, `refreshToken()`, `getMe()`  
**`notesApi.ts`**: `getAllNotes()`, `getNote(id)`, `createNote(data)`, `updateNote(id, data)`, `deleteNote(id)`, `searchNotes(query)`, `syncNotes(since)`  
**`foldersApi.ts`**: `getFolders()`, `createFolder(data)`, `updateFolder(id, data)`, `deleteFolder(id)`  
**`recycleBinApi.ts`**: `getDeleted()`, `restoreNote(id)`, `hardDelete(id)`, `emptyBin()`  
**`aiApi.ts`**: `summarize(noteId)`, `generateTags(noteId)`, `improveNote(noteId)`, `askNotes(question, noteIds)`  

Each function uses the `api` Axios instance and returns typed data.

---

### 3.8 TypeScript Types (`src/types/index.ts`)

```ts
export interface User {
  id: number
  name: string
  email: string
}

export interface Note {
  id: number
  title: string
  content: string
  folderId: number | null
  folderName: string | null
  tags: string[]
  wordCount: number
  createdAt: string
  updatedAt: string
  deleted: boolean
}

export interface Folder {
  id: number
  name: string
  parentId: number | null
  children: Folder[]
  noteCount: number
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface SyncResponse {
  updated: Note[]
  deletedIds: number[]
  serverTime: string
}
```

---

### 3.9 Routes (`src/App.tsx`)

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<NotesPage />} />
        <Route path="/notes/:id" element={<NoteEditorPage />} />
        <Route path="/folder/:folderId" element={<NotesPage />} />
        <Route path="/recycle-bin" element={<RecycleBinPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
```

#### `ProtectedRoute.tsx`
If no `accessToken` in auth store → redirect to `/login`. Otherwise render `<Outlet />`.

#### `OAuth2CallbackPage.tsx`
- On mount: parse `?token=` and `?refreshToken=` from URL params
- Fetch user profile with `getMe()`
- Store in auth store, redirect to `/`
- Show loading spinner during this flow

---

## 🗂️ PHASE 4 — FRONTEND FEATURES (UI MATCHING REFERENCE SCREENSHOTS)

### 4.1 Design System Reference

Based on the provided UI screenshots, implement this exact layout and visual language:

**Color Palette (Dark mode — default)**:
- Sidebar: `#0F172A` (very dark navy)
- Main content: `#FFFFFF` (white canvas)
- Sidebar active item: `#1E293B`
- Text on sidebar: `#E2E8F0`
- Muted text on sidebar: `#64748B` (for tagline)
- Search bar: light gray rounded pill
- Accent / CTA buttons: `#6366F1` (indigo-500)
- Note icon color: `#6366F1`

**Typography**:
- Logo: Bold, ~20px, white
- Tagline: Italic, small, muted gray
- Page title: ~28px bold, dark text
- Subtitle: muted gray, 14px
- Note card title: 16px semibold
- Note card meta: 13px muted

**Layout Dimensions**:
- Sidebar width: 300px fixed
- Sidebar top: logo + tagline (height ~80px)
- Top navbar: height ~56px, search bar centered
- Avatar: 36px circle, indigo background, white letter

---

### 4.2 `AppLayout.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Sidebar (300px)    │  Top Navbar (full width)               │
│  ─────────────────  │  ──────────────────────────────────── │
│  [Logo] NoteVault   │  [🔍 Search your vault...]  [Avatar]  │
│  tagline italic     │                                        │
│  ─────────────────  │  ──────────────────────────────────── │
│  📄 All Notes       │                                        │
│  🗑️ Recycle Bin     │         <Outlet /> (page content)     │
│  ─────────────────  │                                        │
│  FOLDERS  [+]       │                                        │
│  > Folder tree      │                                        │
└──────────────────────────────────────────────────────────────┘
```

Sidebar is dark (`#0F172A`). Main area is white (light) or `#F8FAFC`.  
The sidebar does NOT change theme — it is always dark navy.  
The main content area and top navbar toggle between light/dark.

---

### 4.3 Auth Pages — Exact match to screenshots

#### `LoginPage.tsx`

**Layout**: Centered, white background with very subtle light gray (`#EEF2FF`) bg. Logo + tagline at top. Card with rounded corners, white background, shadow.

```
[Logo Icon] NoteVault
Where your ideas stay truly yours.

┌────────────────────────────────────────┐
│  Welcome back                          │
│  Sign in to your vault                 │
│                                        │
│  [G  Continue with Google]             │
│                                        │
│         ──── OR ────                   │
│                                        │
│  Email                                 │
│  [________________________]            │
│                                        │
│  Password                           👁 │
│  [________________________]            │
│                                        │
│  [        Sign in         ]            │
│                                        │
│  New here? Create an account           │
└────────────────────────────────────────┘
```

- "Continue with Google" button: white border, Google G icon (colored SVG), dark text, full-width rounded
- "Sign in" button: indigo-500 background, white text, full-width, bold, rounded-lg
- Password field has eye toggle icon on the right
- "Create an account" is a hyperlink in indigo color
- Show error toast on invalid credentials
- Show loading spinner inside "Sign in" button when submitting

#### `RegisterPage.tsx`

Similar to LoginPage but:
- Title: "Create your vault" / subtitle: "It only takes a minute"
- Fields: Name, Email, Password, Confirm Password
- Button: "Create account"
- Link: "Already have an account? Sign in"
- Validate: passwords match, email format, name required
- Passwords must be ≥ 8 characters

Both pages: import `Sora` font, match exact font weights and spacing from screenshots.

---

### 4.4 `NotesPage.tsx` (All Notes / Folder view)

**Matches screenshots 3 & 4 exactly.**

Top row:
- Left: "All Notes" (bold, ~28px) / subtitle "Everything in your vault"
- Right: "+ New note" button (indigo, rounded)

**Empty state** (screenshot 3):
- Centered icon (note icon in gray circle)
- "No notes here yet"
- "Start capturing your ideas. Your vault is private and yours alone."
- "Create your first note" button (indigo)

**With notes** (screenshot 4):
- Grid of note cards (max 3 columns on desktop, 2 on tablet, 1 on mobile)
- Each card: white background, rounded-xl, border, subtle shadow
  - Note icon (indigo) + title (bold)
  - First 100 chars of content as preview (muted text)
  - "Updated X ago" (time-ago format using `date-fns`)
  - On hover: slight scale(1.01), shadow increase
  - On click: navigate to `/notes/:id`
  - Right-click or hover shows context menu: "Move to folder", "Delete" (trash → recycle bin)

**Search**: Debounced (300ms), hits `GET /api/notes/search?q=`, updates notes grid live.

---

### 4.5 `NoteEditorPage.tsx` (Full Tiptap editor — matches screenshot 6)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│ Formatting toolbar: B | I | H1 | H2 | • | 1. | " | <> | ✨AI | 🗑 │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  Untitled                    (editable, large, 36px bold)   │
│                                                              │
│  Start writing your idea...  (placeholder, muted)           │
│                                                              │
│  (Full height Tiptap editor area)                           │
│                                                              │
│──────────────────────────────────────────────────────────────│
│  0 words                                    Saved ✓          │
└──────────────────────────────────────────────────────────────┘
```

**Tiptap extensions**: StarterKit, Placeholder, Highlight, CodeBlock  
**Toolbar buttons** (match screenshot exactly): Bold, Italic, H1, H2, Bullet list, Ordered list, Blockquote, Code block  
**Right side of toolbar**: ✨ AI button (indigo, opens AI panel), 🗑 Delete button (red icon)

**Auto-save**:
- Debounce content changes by 1500ms
- On save: call `updateNote(id, { title, content })`
- Show "Saving..." → "Saved ✓" status in bottom bar
- Word count updates in real time

**Title**: Separate `<input>` styled as large heading (no border, transparent bg), triggers same auto-save

**AI Panel** (slides in from right, width 320px):
- Triggered by ✨ AI button
- Tabs or buttons: Summarize | Generate Tags | Improve | Ask a question
- Each action calls respective API endpoint
- Shows streaming-like text response
- "Apply" button for Improve (replaces editor content)
- "Apply Tags" button for Generate Tags

---

### 4.6 `Sidebar.tsx`

Matches screenshots 3-6 exactly:
- Top: `[📔 icon] NoteVault` bold white, below: italic small muted tagline
- `📄 All Notes` — active state: `#1E293B` background, white text
- `🗑️ Recycle Bin` — same style inactive
- Divider line
- `FOLDERS` label + `+` icon button (muted, small caps)
- Folder tree: recursive `FolderItem` component with indent per level
  - Click to filter notes by folder
  - Context menu: Rename, Delete
- "No folders yet" text when empty

---

### 4.7 `TopNavbar.tsx`

- Left: empty space (sidebar already has logo)
- Center: Search bar — pill shape, search icon left, placeholder "Search your vault...", full width up to 600px
- Right: Avatar circle (indigo bg, first letter of user name, white text)
  - On click: dropdown (matches screenshot 5):
    - Name (bold)
    - Email (muted, small)
    - Divider
    - 🚪 Sign out (red text)
  - Also include: 🌙/☀️ theme toggle icon button (to the left of avatar)

---

### 4.8 `RecycleBinPage.tsx`

- Title: "Recycle Bin" with subtitle
- Grid of deleted note cards (grayed out style)
- Each card: "Restore" button (green) + "Delete permanently" button (red)
- "Empty Recycle Bin" button top right (red, only shows if there are deleted notes)
- Empty state: icon + "Recycle bin is empty"

---

### 4.9 Shared UI Components (`src/components/ui/`)

Create all these fully implemented:

**`Button.tsx`**: variants = `primary | secondary | ghost | danger`, sizes = `sm | md | lg`, loading state (spinner)  
**`Input.tsx`**: label, error state, helper text, password toggle  
**`Card.tsx`**: hover animations, onClick  
**`Skeleton.tsx`**: animated pulse skeleton for note cards and sidebar  
**`Toast.tsx`**: use `react-hot-toast`, custom styled for dark/light  
**`Modal.tsx`**: portal-based, backdrop blur, smooth open/close animation  
**`ContextMenu.tsx`**: position-aware dropdown menu  
**`FolderItem.tsx`**: recursive tree item  
**`NoteCard.tsx`**: note preview card with animations  
**`ThemeToggle.tsx`**: sun/moon icon toggle button  
**`SyncIndicator.tsx`**: small green/gray dot + text in corner  
**`EmptyState.tsx`**: icon + title + subtitle + optional CTA button  

---

### 4.10 Loading States

- On initial notes load: show 6 skeleton note cards (3-column grid)
- On sidebar load: show 3 skeleton folder items
- On note editor load: show skeleton title + 3 skeleton text lines
- All skeletons use `bg-gray-200 dark:bg-slate-700 animate-pulse`

---

## 🗂️ PHASE 5 — AI, SYNC, PWA

### 5.1 Dexie.js Schema (`src/services/db.ts`)

```ts
import Dexie, { Table } from 'dexie'
import { Note, Folder } from '../types'

class NoteVaultDB extends Dexie {
  notes!: Table<Note>
  folders!: Table<Folder>
  syncMeta!: Table<{ key: string; value: string }>

  constructor() {
    super('NoteVaultDB')
    this.version(1).stores({
      notes: '++id, userId, folderId, updatedAt, deleted',
      folders: '++id, userId, parentId',
      syncMeta: 'key',
    })
  }
}

export const db = new NoteVaultDB()
```

---

### 5.2 Sync Service (`src/services/syncService.ts`)

```ts
export async function syncWithServer() {
  const lastSync = await db.syncMeta.get('lastSync')
  const since = lastSync?.value || '1970-01-01T00:00:00Z'

  const response = await syncNotes(since) // API call
  
  // Upsert updated notes to IndexedDB
  await db.notes.bulkPut(response.updated)
  
  // Mark deleted notes in IndexedDB
  for (const id of response.deletedIds) {
    await db.notes.update(id, { deleted: true })
  }
  
  // Update last sync time
  await db.syncMeta.put({ key: 'lastSync', value: response.serverTime })
}
```

- Call `syncWithServer()` on app startup (if online)
- Call on window focus event
- Show `SyncIndicator` status: syncing (spinning), synced (green dot), offline (gray dot)

---

### 5.3 PWA Setup (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'NoteVault',
        short_name: 'NoteVault',
        description: 'Where your ideas stay truly yours.',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^http:\/\/localhost:8080\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 }
          }
        ]
      }
    })
  ]
})
```

---

### 5.4 Offline Handling

- Detect `navigator.onLine` and listen to `online/offline` events
- When offline: load notes from IndexedDB (Dexie), show offline banner
- Queue creates/updates made offline; flush queue when back online
- `SyncIndicator` shows: 🟢 Synced / 🔄 Syncing / 🔴 Offline

---

### 5.5 Environment Variables (`.env`)

```
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Never expose sensitive backend secrets in frontend. Only these two are needed on frontend.

---

## 📋 FILE CHECKLIST — ALL MUST BE GENERATED

### Backend (Java)
- [ ] `pom.xml`
- [ ] `application.properties`
- [ ] `NoteVaultApplication.java`
- [ ] `config/SecurityConfig.java`
- [ ] `config/CorsConfig.java`
- [ ] `config/WebClientConfig.java`
- [ ] `config/AesConfig.java`
- [ ] `entity/User.java`
- [ ] `entity/Note.java`
- [ ] `entity/Folder.java`
- [ ] `entity/RefreshToken.java`
- [ ] `entity/AuditLog.java`
- [ ] `entity/AuthProvider.java` (enum: LOCAL, GOOGLE)
- [ ] `repository/UserRepository.java`
- [ ] `repository/NoteRepository.java`
- [ ] `repository/FolderRepository.java`
- [ ] `repository/RefreshTokenRepository.java`
- [ ] `repository/AuditLogRepository.java`
- [ ] `dto/request/LoginRequest.java`
- [ ] `dto/request/RegisterRequest.java`
- [ ] `dto/request/NoteRequest.java`
- [ ] `dto/request/FolderRequest.java`
- [ ] `dto/request/AiRequest.java`
- [ ] `dto/response/AuthResponse.java`
- [ ] `dto/response/NoteResponse.java`
- [ ] `dto/response/FolderResponse.java`
- [ ] `dto/response/AiResponse.java`
- [ ] `dto/response/SyncResponse.java`
- [ ] `security/JwtTokenProvider.java`
- [ ] `security/JwtAuthenticationFilter.java`
- [ ] `security/CustomUserDetailsService.java`
- [ ] `security/OAuth2UserService.java`
- [ ] `security/OAuth2AuthenticationSuccessHandler.java`
- [ ] `security/CustomOAuth2User.java`
- [ ] `controller/AuthController.java`
- [ ] `controller/NoteController.java`
- [ ] `controller/FolderController.java`
- [ ] `controller/RecycleBinController.java`
- [ ] `controller/AiController.java`
- [ ] `controller/SyncController.java`
- [ ] `controller/AuditController.java`
- [ ] `service/AuthService.java`
- [ ] `service/NoteService.java`
- [ ] `service/FolderService.java`
- [ ] `service/RecycleBinService.java`
- [ ] `service/AiService.java`
- [ ] `service/SyncService.java`
- [ ] `service/AuditService.java`
- [ ] `service/EncryptionService.java`
- [ ] `util/AesEncryptionUtil.java`
- [ ] `scheduler/RecycleBinScheduler.java`
- [ ] `exception/GlobalExceptionHandler.java`
- [ ] `exception/ResourceNotFoundException.java`
- [ ] `exception/UnauthorizedException.java`

### Frontend (React/TypeScript)
- [ ] `package.json`
- [ ] `vite.config.ts`
- [ ] `tailwind.config.ts`
- [ ] `postcss.config.js`
- [ ] `tsconfig.json`
- [ ] `index.html` (Google fonts import: Sora, JetBrains Mono)
- [ ] `.env` (template)
- [ ] `src/main.tsx` (theme init, app root)
- [ ] `src/App.tsx` (routes)
- [ ] `src/types/index.ts`
- [ ] `src/store/authStore.ts`
- [ ] `src/store/themeStore.ts`
- [ ] `src/store/notesStore.ts`
- [ ] `src/store/folderStore.ts`
- [ ] `src/api/axiosInstance.ts`
- [ ] `src/api/authApi.ts`
- [ ] `src/api/notesApi.ts`
- [ ] `src/api/foldersApi.ts`
- [ ] `src/api/recycleBinApi.ts`
- [ ] `src/api/aiApi.ts`
- [ ] `src/services/db.ts`
- [ ] `src/services/syncService.ts`
- [ ] `src/hooks/useNotes.ts`
- [ ] `src/hooks/useFolders.ts`
- [ ] `src/hooks/useSync.ts`
- [ ] `src/hooks/useDebounce.ts`
- [ ] `src/layouts/AppLayout.tsx`
- [ ] `src/layouts/AuthLayout.tsx`
- [ ] `src/components/Sidebar.tsx`
- [ ] `src/components/TopNavbar.tsx`
- [ ] `src/components/FolderItem.tsx`
- [ ] `src/components/NoteCard.tsx`
- [ ] `src/components/AiPanel.tsx`
- [ ] `src/components/SyncIndicator.tsx`
- [ ] `src/components/ProtectedRoute.tsx`
- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Input.tsx`
- [ ] `src/components/ui/Card.tsx`
- [ ] `src/components/ui/Skeleton.tsx`
- [ ] `src/components/ui/Modal.tsx`
- [ ] `src/components/ui/ContextMenu.tsx`
- [ ] `src/components/ui/ThemeToggle.tsx`
- [ ] `src/components/ui/EmptyState.tsx`
- [ ] `src/pages/LoginPage.tsx`
- [ ] `src/pages/RegisterPage.tsx`
- [ ] `src/pages/OAuth2CallbackPage.tsx`
- [ ] `src/pages/NotesPage.tsx`
- [ ] `src/pages/NoteEditorPage.tsx`
- [ ] `src/pages/RecycleBinPage.tsx`
- [ ] `public/manifest.json`
- [ ] `public/icons/icon-192.png` (generate programmatically or use placeholder)
- [ ] `public/icons/icon-512.png`

---

## 🚦 EXECUTION RULES FOR CURSOR

1. **Generate files in this order**: entities → repositories → services → controllers → security → frontend store → frontend API → frontend pages
2. **Do NOT use any mock data**: every UI interaction calls a real backend endpoint
3. **Do NOT leave any TODO comments** in the code
4. **All Spring components must have proper `@Service`, `@Repository`, `@RestController`, `@Component` annotations**
5. **All DTOs must use `@Valid` validation annotations** where appropriate
6. **All frontend components must be properly typed** with TypeScript interfaces
7. **Dark mode must work on every single page** including auth pages (though auth pages have a fixed light-ish bg that works in both modes)
8. **The sidebar is ALWAYS dark** (`bg-[#0F172A]`) regardless of theme toggle
9. **Google OAuth button must use the official Google G SVG icon** (colored: blue G)
10. **Auto-save in the editor must show visual feedback** (Saving... → Saved ✓)
11. **All API errors must show toast notifications**, not console.log
12. **Refresh token rotation**: after using refresh token, invalidate old one, issue new pair
13. **Never expose AES key in frontend** — encryption/decryption happens ONLY on backend
14. **Folder deletion** must recursively delete child folders and move their notes to root (not delete notes)
15. **Word count** must update in real time as user types in the editor

---

## 🧪 SETUP & RUN INSTRUCTIONS

After generating all files, also generate a `README.md` with:

### Backend Setup
```bash
# 1. Create MySQL database
mysql -u root -p -e "CREATE DATABASE notevault;"

# 2. Set environment variables
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=base64-encoded-256-bit-secret
export AES_SECRET_KEY=32-character-secret-key
export GEMINI_API_KEY=your-gemini-api-key
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret

# 3. Run
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd notevault-frontend
cp .env.example .env
# Fill in VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- H2 Console (dev only): disabled (MySQL only)

---

## ✅ FINAL VALIDATION CHECKLIST

Before completing, verify:
- [ ] User can register with email/password
- [ ] User can login and receive JWT
- [ ] Google OAuth login redirects correctly and creates/finds user
- [ ] Protected routes redirect to login when not authenticated
- [ ] Refresh token silently renews expired access token
- [ ] Note content is AES-encrypted in DB (verify: raw DB value is not readable text)
- [ ] Create, edit, delete notes all work
- [ ] Folders can be created, renamed, deleted
- [ ] Notes can be moved to folders
- [ ] Soft delete moves note to recycle bin
- [ ] Restore from recycle bin works
- [ ] Hard delete from recycle bin works
- [ ] Search filters notes live
- [ ] AI Summarize returns a summary
- [ ] AI Generate Tags returns tags
- [ ] AI Improve returns improved content
- [ ] AI Ask returns an answer using note context
- [ ] Theme toggles between dark and light
- [ ] Theme persists after page refresh
- [ ] App installs as PWA
- [ ] Offline shows notes from IndexedDB
- [ ] Sync runs on app start and window focus
- [ ] Audit logs are recorded for login, note CRUD
- [ ] Recycle bin scheduler deletes notes older than 30 days
- [ ] No hardcoded API keys anywhere in codebase
