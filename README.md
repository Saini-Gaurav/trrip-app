# Trrip — AI-Powered Travel Itinerary Generator

> **Trrip** lets users upload their travel booking documents (flight tickets, hotel confirmations, etc.) and automatically generates a rich, day-by-day travel itinerary using **Google Gemini AI**. Documents are stored securely on **AWS S3**, data lives in **MongoDB**, and the whole stack is TypeScript end-to-end.

---

## 🗂️ Project Structure

```
trrip-app/
├── backend/          Node.js + Express + TypeScript API
│   └── src/
│       ├── config/         Database & S3 clients
│       ├── controllers/    Route handlers
│       ├── middleware/      Auth, rate-limiting, logging, validation, upload
│       ├── models/         Mongoose schemas (User, Document, Itinerary)
│       ├── repositories/   Data-access layer
│       ├── routes/         Express routers
│       ├── services/       Business logic (Auth, S3, Extraction, Gemini, Itinerary)
│       ├── types/          Shared TypeScript interfaces
│       └── utils/          Winston logger
└── frontend/         React + TypeScript + Tailwind CSS SPA
    └── src/
        ├── components/     Reusable UI (Layout, ItineraryCard)
        ├── context/        AuthContext (JWT storage)
        ├── pages/          Landing, Login, Register, Dashboard, Upload, Detail, History, Shared
        ├── services/       Axios API client
        └── types/          Frontend TypeScript interfaces
```

---

## ✨ Features

| Feature | Details |
|---|---|
| **JWT Auth** | Register / Login / Protected routes |
| **Document Upload** | Drag-and-drop UI, PDFs & images, up to 5 files at once |
| **AWS S3 Storage** | All documents stored in S3; signed URLs for secure access |
| **Text Extraction** | PDF text via `pdf-parse`; image OCR via `tesseract.js` |
| **Gemini AI** | Extracts booking data from raw text/images, then generates a full itinerary |
| **Itinerary Management** | Create, view, delete; full pagination |
| **Sharing** | Toggle public sharing; unique share link per itinerary |
| **Rate Limiting** | 4 granular limiters (global, auth, upload, AI) |
| **Structured Logging** | Winston → console + rotating log files |
| **Premium UI** | Dark navy/gold theme, fully responsive, Tailwind CSS |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- AWS account with an S3 bucket
- Google Gemini API key

### 1 — Clone & install

```bash
git clone <repo-url>
cd trrip-app

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2 — Environment variables

**Backend** — copy and fill in:

```bash
cd backend
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong random secret (use `openssl rand -hex 32`) |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/) |
| `AWS_ACCESS_KEY_ID` | AWS IAM user key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret |
| `AWS_REGION` | e.g. `ap-south-1` |
| `AWS_S3_BUCKET_NAME` | Your S3 bucket name |
| `CLIENT_URL` | Frontend URL for CORS (default: `http://localhost:5173`) |

**Frontend** — copy and fill in:

```bash
cd frontend
cp .env.example .env
# Edit VITE_API_URL if your backend is not on localhost:5000
```

### 3 — AWS S3 Setup

1. Create an S3 bucket (uncheck "Block all public access" for signed-URL access)
2. Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

3. Add a CORS configuration to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-production-domain.com"],
    "ExposeHeaders": []
  }
]
```

### 4 — Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

App will be live at **http://localhost:5173**

---

## 📡 API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Create account — returns `accessToken` + sets `trrip_refresh` httpOnly cookie |
| `POST` | `/api/auth/login` | ❌ | Login — returns `accessToken` + sets `trrip_refresh` httpOnly cookie |
| `POST` | `/api/auth/refresh` | ❌ (cookie) | Exchange refresh cookie for new `accessToken`; rotates the cookie |
| `GET` | `/api/auth/profile` | ✅ | Get current user |
| `POST` | `/api/auth/logout` | ✅ | Revokes this device's refresh token + clears cookie |

**Token strategy:**
- **Access token** — short-lived JWT (15 min), sent as `Authorization: Bearer <token>` header
- **Refresh token** — 7-day random token, stored **hashed in MongoDB**, sent only via `httpOnly; Secure; SameSite=Strict` cookie scoped to `/api/auth`
- **Rotation** — every `/auth/refresh` call deletes the old token and issues a new one
- **Silent refresh** — the frontend axios interceptor catches `TOKEN_EXPIRED` (HTTP 401), calls `/auth/refresh` transparently, then retries the original request — all pages work without any reload

### Documents

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents` | ✅ | Upload files (multipart, field `files`) |
| `GET` | `/api/documents` | ✅ | List user's documents |
| `DELETE` | `/api/documents/:id` | ✅ | Delete document |
| `GET` | `/api/documents/:id/signed-url` | ✅ | Get S3 download URL |

### Itineraries

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/itineraries/generate` | ✅ | Generate from `{ documentIds: [] }` |
| `GET` | `/api/itineraries` | ✅ | List (paginated) |
| `GET` | `/api/itineraries/:id` | ✅ | Get single |
| `PATCH` | `/api/itineraries/:id/share` | ✅ | Toggle sharing `{ isShared: bool }` |
| `DELETE` | `/api/itineraries/:id` | ✅ | Delete |
| `GET` | `/api/itineraries/shared/:token` | ❌ | Public share view |

---

## 🛡️ Rate Limiting

| Limiter | Window | Max | Applied To |
|---|---|---|---|
| Global | 15 min | 100 req/IP | All `/api/*` routes |
| Auth | 15 min | 10 attempts (failures only) | `/api/auth/login` & `/register` |
| Upload | 10 min | 20 uploads | `POST /api/documents` |
| AI Generation | 1 hour | 15 generations | `POST /api/itineraries/generate` |

---

## 📋 Logging

Winston is configured with three outputs:

| Output | Level | Format |
|---|---|---|
| Console | `debug` (dev) / `info` (prod) | Coloured human-readable (dev) / JSON (prod) |
| `logs/error.log` | `error` only | JSON, 5 MB rotation, 5 files |
| `logs/combined.log` | All | JSON, 10 MB rotation, 10 files |

HTTP request logs are piped via morgan → winston at the `http` level.  
Passwords are redacted from request body logs automatically.

---

## 🏗️ Tech Stack

**Backend**
- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + bcrypt
- AWS SDK v3 (`@aws-sdk/client-s3`)
- Google Generative AI (`@google/generative-ai` — Gemini 1.5 Flash)
- `pdf-parse` + `tesseract.js` for text extraction
- `multer` for file handling
- `express-rate-limit` for rate limiting
- `winston` + `morgan` for logging
- `zod` for request validation
- `helmet` for security headers

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS (custom premium theme)
- React Router v6
- Axios
- `react-dropzone` (drag-and-drop uploads)
- `react-hot-toast`
- Lucide React icons

---

## 🚢 Deployment Notes

- **Backend**: Deploy to Railway, Render, or EC2. Set all env vars. Run `npm run build && npm start`.
- **Frontend**: Deploy to Vercel or Netlify. Set `VITE_API_URL` to your backend URL.
- **MongoDB**: Use MongoDB Atlas free tier.
- **S3**: Free tier covers this assignment comfortably (5 GB / 20K GET / 2K PUT per month).

---

## 📁 Folder Structure (detailed)

```
backend/src/
├── config/
│   ├── database.ts       Mongoose connection
│   └── s3.ts             AWS S3 client
├── controllers/
│   ├── authController.ts
│   ├── documentController.ts
│   └── itineraryController.ts
├── middleware/
│   ├── auth.ts           JWT verification
│   ├── errorHandler.ts   Global error handler + AppError class
│   ├── httpLogger.ts     Morgan → Winston HTTP logging
│   ├── rateLimiter.ts    4 granular rate limiters
│   ├── upload.ts         Multer memory storage
│   └── validate.ts       Zod request validation
├── models/
│   ├── User.ts
│   ├── Document.ts
│   └── Itinerary.ts
├── repositories/
│   ├── userRepository.ts
│   ├── documentRepository.ts
│   └── itineraryRepository.ts
├── routes/
│   ├── authRoutes.ts
│   ├── documentRoutes.ts
│   └── itineraryRoutes.ts
├── services/
│   ├── authService.ts
│   ├── s3Service.ts
│   ├── extractionService.ts
│   ├── geminiService.ts
│   ├── documentService.ts
│   └── itineraryService.ts
├── types/
│   └── index.ts
├── utils/
│   └── logger.ts         Winston logger instance
└── index.ts              App entry point
```
