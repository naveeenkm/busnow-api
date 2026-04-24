# BusNow — Backend API

Node.js · Express · MongoDB Atlas · JWT · Winston

---

## Quick Start

```bash
cd busnow-api
cp .env.example .env   # fill in values (see Environment Variables below)
npm install
npm run dev            # starts on http://localhost:5000
```



---

## Environment Variables

| Variable            | Required | Description                                      |
|---------------------|----------|--------------------------------------------------|
| `MONGO_URI`         | ✅       | MongoDB Atlas connection string                  |
| `JWT_SECRET`        | ✅       | Secret for signing access tokens (30 min)        |
| `JWT_REFRESH_SECRET`| ✅       | Secret for signing refresh tokens (30 days)      |
| `PORT`              |          | Server port (default: `5000`)                    |
| `CORS_ORIGIN`       |          | Comma-separated allowed origins (empty = all)    |
| `LOG_LEVEL`         |          | Winston log level (default: `http`)              |
| `NODE_ENV`          |          | Set to `production` to enable secure cookies     |

---

## Project Structure

```
src/
├── config/
│   ├── db.js          # Mongoose connection
│   └── logger.js      # Winston logger (helpers + console + rotating files)
├── constants/
│   └── index.js       # HTTP codes, messages, config values
├── controllers/       # Thin layer — request/response only
│   ├── auth.controller.js
│   ├── bus.controller.js
│   ├── routeRequest.controller.js
│   ├── user.controller.js
│   └── adminUser.controller.js
├── middleware/
│   ├── auth.js        # JWT auth + adminOnly guards
│   └── error.js       # 404 + global error handler
├── models/
│   ├── User.js
│   ├── Bus.js
│   ├── RouteRequest.js
│   └── RideHistory.js
├── routes/
│   ├── auth.routes.js
│   ├── bus.routes.js
│   ├── routeRequest.routes.js
│   ├── user.routes.js
│   └── adminUser.routes.js
├── services/          # Business logic + DB operations
│   ├── auth.service.js
│   ├── bus.service.js
│   ├── routeRequest.service.js
│   ├── user.service.js
│   ├── adminUser.service.js
│   ├── seed.service.js
│   └── token.service.js
└── server.js
logs/                      # Auto-created — rotating log files
```

---

## Logging

Uses **Winston** with structured helper functions and three transports:

| Transport       | Level   | Output                                  |
|-----------------|---------|-----------------------------------------|
| Console         | all     | Colorized, timestamped (`HH:mm:ss`)     |
| `error-*.log`   | error   | `logs/error-YYYY-MM-DD.log` (14 days)   |
| `combined-*.log`| all     | `logs/combined-YYYY-MM-DD.log` (14 days)|

### Log Helpers

```js
import { logInfo, logWarn, logError, logDebug, logHttp } from './config/logger.js';

logInfo('Controller:login - Success', { userId, email });
logWarn('Middleware:auth - No token', { method, url });
logError('Server:start - Failed', { stack, message });
logDebug('Controller:geocodeCity - Geocoded', { lat, lon });
logHttp('GET /api/buses 200 12ms', { snippet });
```

### Log Format

All logs follow the pattern: `[Category] Context:function - Message { meta }`

### Log Levels

- `http` — every incoming request
- `info` — server start, DB connect, seed events, auth success, logout
- `warn` — auth failures, 404s, CORS blocks, geocode misses
- `error` — unhandled errors, geocode fetch failures
- `debug` — geocode coordinates (verbose, off by default)

To enable debug logs: set `LOG_LEVEL=debug` in `.env`.

---

## API Reference

### Health Check

| Method | Path                | Auth | Notes                                      |
|--------|---------------------|------|--------------------------------------------|
| GET    | `/api/health-check` | —    | Returns `status`, `db`, `uptime`, `timestamp` |

**Healthy response (200):**
```json
{ "status": "healthy", "db": "connected", "uptime": 42, "timestamp": "2024-01-01T00:00:00.000Z" }
```
**Unhealthy response (503):**
```json
{ "status": "unhealthy", "db": "disconnected", "uptime": 5, "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

### Auth — `/api/auth`

| Method | Path        | Auth     | Body / Notes                          |
|--------|-------------|----------|---------------------------------------|
| POST   | `/register` | —        | `{ name, email, password }`           |
| POST   | `/login`    | —        | `{ email, password }`                 |
| POST   | `/refresh`  | cookie   | Uses `refreshToken` cookie            |
| POST   | `/logout`   | —        | Clears `refreshToken` cookie          |
| GET    | `/me`       | Bearer   | Returns current user                  |

---

### Buses — `/api/buses`

| Method | Path        | Auth     | Notes                                         |
|--------|-------------|----------|-----------------------------------------------|
| GET    | `/`         | admin    | List all approved buses                       |
| POST   | `/search`   | —        | `{ from?, to? }` — filtered list             |
| POST   | `/nearby`   | —        | `{ from, to }` — geo-proximity suggestions   |
| GET    | `/popular`  | —        | Top 6 routes by bus count                    |
| GET    | `/cities`   | —        | Distinct city names (for autosuggest)         |
| POST   | `/`         | admin    | Create bus                                    |
| PUT    | `/:id`      | admin    | Update bus                                    |
| DELETE | `/:id`      | admin    | Delete bus                                    |

---

### Route Requests — `/api/route-requests`

| Method | Path    | Auth     | Notes                                              |
|--------|---------|----------|----------------------------------------------------|
| POST   | `/`     | optional | `{ fromCity, toCity, notes?, contactEmail?, arrivalTime? }` |
| GET    | `/`     | admin    | List all requests                                  |
| PATCH  | `/:id`  | admin    | `{ status: 'approved' \| 'rejected', rejectionReason? }` — approving auto-creates a bus |

---

### User — `/api/users`

| Method | Path                  | Auth   | Notes                          |
|--------|-----------------------|--------|--------------------------------|
| GET    | `/me/history`         | Bearer | Ride history                   |
| POST   | `/me/history`         | Bearer | `{ busId }`                    |
| GET    | `/me/favorites`       | Bearer | Saved routes                   |
| POST   | `/me/favorites`       | Bearer | `{ from, to }`                 |
| DELETE | `/me/favorites/:id`   | Bearer | Remove a favorite              |
| GET    | `/me/requests`        | Bearer | User's own route requests      |
| PATCH  | `/me`                 | Bearer | `{ name?, currentPassword?, newPassword? }` |
| DELETE | `/me`                 | Bearer | Delete own account             |

---

### Admin Users — `/api/admin/users`

| Method | Path    | Auth  | Notes                              |
|--------|---------|-------|------------------------------------|
| GET    | `/`     | admin | List all users                     |
| DELETE | `/:id`  | admin | Delete user (cannot delete self)   |

---

## Auth Flow

- Login/Register returns an `accessToken` (30 min) in the JSON body and sets a `refreshToken` (30 days) as an `httpOnly` cookie.
- Send `Authorization: Bearer <accessToken>` on protected routes.
- Call `POST /api/auth/refresh` to get a new access token using the cookie.

---

## MongoDB Atlas — IP Whitelist

If you see a connection error mentioning IP whitelist:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Network Access**
2. Click **Add IP Address**
3. Add your current IP, or use `0.0.0.0/0` for development
4. Wait ~30 seconds, then restart the server
