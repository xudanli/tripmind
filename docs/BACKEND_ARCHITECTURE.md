# TripMind Backend Architecture Guide

## 1. Overview
- **Goal**: Provide a production-ready backend service to support the AI Journey Inspiration flow, transportation enrichment, and external data aggregation.
- **Style**: Node.js 22 + TypeScript, built with NestJS for modularity, dependency injection, and auto-generated Swagger docs.
- **Deployment**: Containerised (Docker). Recommended to pair with GitHub Actions for CI/CD, deploy on Fly.io, Render, or Kubernetes.

## 2. Technology Stack
- **Framework**: NestJS (Express adapter) + TypeScript.
- **Runtime**: Node.js 22 (ES2022 features, top-level await).
- **HTTP Client**: Axios with retry/interceptor helpers.
- **Database**: PostgreSQL (via Prisma or TypeORM). Switch to MongoDB if document-first.
- **Cache & Queue**: Redis + BullMQ (async tasks, caching).
- **Logging**: Pino core logger with optional Winston transports (JSON logs for ELK or GCP).
- **Config**: `@nestjs/config` + dotenv; separate `.env` for dev/stage/prod.
- **Auth (optional)**: JWT for user-scoped endpoints, API Key for service-to-service calls.
- **Documentation**: Swagger UI (auto-generated) + Redoc build export.
- **Testing**: Jest + Supertest (unit + integration).
- **Observability**: Prometheus metrics endpoint + Health check (`/health`).

## 3. Module Breakdown

| Module               | Key Providers / Responsibilities |
|----------------------|-----------------------------------|
| `GatewayModule`      | Global interceptors, exception filters, logging, rate limiting, request-id middleware. |
| `JourneyModule`      | `JourneyController`, `JourneyService`, sub-services (`FrameworkGenerator`, `DayDetailsGenerator`, `ScenicIntroGenerator`, `TransportGenerator`, `TipsGenerator`). Houses orchestration logic migrated from `src/services/journey/*`. |
| `LLMModule`          | `LLMClientFactory` (DeepSeek/OpenAI), `PromptRegistry`, `JSONProcessor` (parsing & repair), request retries, metrics. |
| `DestinationModule`  | `GeocodeService` (Mapbox), `TransportService` (Directions + mode normalisation), `AltitudeService` (high-altitude DB), `FestivalService` (Eventbrite). |
| `GuidesModule`       | `GuidesController`, `GuideSourceService` (Google Custom Search / official APIs / RSS), `GuidesCacheService` (Redis). |
| `CatalogModule`      | Loads static reference data (transport enums, constants, curated points-of-interest). Optionally exposes hot reload endpoints. |
| `PersistenceModule`  | Database repositories (`JourneyRepository`, `UserPreferenceRepository`), migration scripts. |
| `TaskModule` (opt.)  | BullMQ queue processors for async generation, cache rebuilds, scheduled jobs. |

> Shared utilities (error helpers, DTO validators, type definitions) live in `libs/shared/`. Static data (e.g. `highAltitudeRegions`) can be published as a private npm package reused by both frontend and backend.

## 4. API Surface (Swagger)

### 4.1 Journey APIs
- `POST /api/journey/generate`  
  Request: `{ input, intent, ctx, selectedDestination?, userRequestedDays?, mode? }`  
  Response: `Itinerary` schema (aligned with `src/validators/itinerarySchema.ts`).
- `POST /api/journey/candidates`  
  Generate destination candidates without full itinerary.
- `POST /api/journey/recalculate-transport`  
  Recompute transport block for a specific day/slot. Request includes slot payload plus optional `journeyId`.
- `GET /api/journey/:id` *(optional)*  
  Fetch stored journey result including metadata & diagnostics.

### 4.2 Destination Intelligence
- `POST /api/destination/geocode` → Mapbox geocoding, returns canonical names & coordinates.
- `POST /api/destination/transport` → Mapbox Directions; returns distance, duration, mode options.
- `POST /api/destination/events` → Eventbrite Discovery; returns `FestivalEvent[]`.
- `GET /api/destination/high-altitude?name=...` → boolean and category (`mid/high/very_high`) with reference note.

### 4.3 Guides Aggregator
- `POST /api/guides/search` → Aggregated travel-guide search across configured platforms.
- `GET /api/guides/sources` → Lists supported platforms and metadata for front-end UI.

### 4.4 Utilities
- `GET /api/reference/catalog` → Constants, enumerations, LLM parameter hints.
- `POST /api/llm/test` *(guarded)* → Manual prompt testing endpoint.
- `GET /health` + `GET /metrics` → Health & Prometheus metrics.

## 5. Data Flow
1. Frontend triggers `POST /api/journey/generate`.
2. `JourneyService` orchestrates generation steps:
   - Resolve destination via `DestinationModule`, fetch context data.
   - Call `LLMModule` sequentially / batched (`framework → dayDetails → scenicIntro → transport → tips`).
   - Persist results (if enabled) via `PersistenceModule`.
3. On slot edits, frontend calls `POST /api/journey/recalculate-transport` to refresh transport + pricing block.
4. Guides search and festival data retrieved via respective modules with Redis caching.

## 6. Development Blueprint
1. **Bootstrap**: `nest new tripmind-backend` → enable `eslint`, `prettier`, absolute imports.
2. **Install dependencies**:
   ```
   npm install @nestjs/config @nestjs/swagger @nestjs/axios axios pino pino-pretty
   npm install class-validator class-transformer
   npm install @nestjs/typeorm typeorm pg
   npm install ioredis bullmq
   npm install zod
   npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
   ```
   (Swap TypeORM for Prisma if desired.)
3. **Environment**: create `.env`, `.env.stage`, `.env.prod`. Example keys:
   ```
   PORT=3000
   DATABASE_URL=postgresql://user:pass@host:5432/tripmind
   REDIS_URL=redis://localhost:6379
   DEEPSEEK_API_KEY=...
   OPENAI_API_KEY=...
   EVENTBRITE_API_TOKEN=...
   MAPBOX_ACCESS_TOKEN=...
   ```
4. **Module scaffolding**: generate Nest modules/controllers/services; port logic from frontend `src/services/journey/`.
5. **DTO & Schema sharing**: create `libs/contracts` package with TypeScript types (Itinerary, IntentResult, TravelContext) reused across front & back.
6. **Testing**: write Jest unit tests per module; Supertest integration covering `/api/journey/generate`.
7. **Swagger**: configure `DocumentBuilder` in `main.ts`, expose `/api/docs`.

## 7. Deployment & Ops
- **Dockerfile**: multi-stage (builder → runtime). Attach `wait-for` script for DB.
- **docker-compose.yaml** (dev): services for backend, Postgres, Redis.
- **CI/CD (GitHub Actions)**:
  1. Lint & test.
  2. Build Docker image.
  3. Push to registry.
  4. Deploy (Fly.io deploy / Kubernetes Helm upgrade).
- **Monitoring**: integrate with Prometheus/Grafana, alert on error rate & queue backlog.
- **Secrets**: store in cloud secret manager (AWS SSM, GCP Secret Manager) or Fly.io secrets. No plain-text `.env` in git.

## 8. Integration Points with Front-End
- Frontend `.env` retains only public keys; sensitive tokens removed.
- Configure `src/config/api.ts` to call backend base URL (e.g., `VITE_API_BASE_URL=https://api.tripmind.app`).
- Pinia store (`stores/travel.ts`) swaps direct service calls for backend endpoints.
- Shared npm package (`@tripmind/contracts`) ensures schema parity.

---

This blueprint consolidates the required backend modules, interfaces, and implementation steps so an engineering team can scaffold and build the service in one pass. Adjust modules or data stores as business scope evolves.


