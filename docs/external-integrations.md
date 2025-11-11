# External API Integrations Overview

## High-Level Flow
- Journey inspiration relies on LLM responses (DeepSeek/OpenAI) orchestrated by `src/services/journeyService.ts`.
- After the LLM returns a journey skeleton, post-processing steps enrich each `timeSlot` with real-world data (transport, pricing, events, imagery) fetched from third-party APIs.
- Enriched data is persisted in the Pinia travel store (`src/stores/travel.ts`) and rendered on the inspiration detail pages (`src/components/TravelDetail/ExperienceDay.vue` and `ExperienceDay/TimeSlotCard.vue`).

## DeepSeek / OpenAI (LLM)
- **Config Keys**: `VITE_DEEPSEEK_API_KEY`, `VITE_OPENAI_API_KEY` (see `src/config/api.ts`).
- **Request Logic**: `src/services/deepseekAPI.ts`
  - `chatWithLLM()` selects DeepSeek or OpenAI based on user preference and makes `fetch` calls to `/v1/chat/completions`.
  - Used by `DeepSeekClient` (`src/llm/deepseekClient.ts`) and directly within chat components.
- **UI Surface**: Generated journeys and daily time slots rendered on the inspiration detail page and discussion/chat components (summary cards, JSON consoles).

## Mapbox (Geocoding & Directions)
- **Config Keys**: `VITE_MAPBOX_ACCESS_TOKEN`, `VITE_MAPBOX_API_URL`.
- **Request Logic**: `src/services/locationInsights.ts`
  - `geocodeMapbox()` resolves venue names to coordinates.
  - `fetchMapboxDirections()` retrieves route summaries for various profiles (driving, walking, cycling).
  - `fetchTransportInsights()` orchestrates the Mapbox calls and returns `summary` + `options`.
- **Downstream Usage**:
  - `journeyService.ts` enriches each `timeSlot.details.transportation` with Mapbox data.
  - Geo metadata (`details.geo`) filled for slots lacking coordinates.
- **UI Surface**: `TimeSlotCard.vue` highlights transport summaries, Mapbox sources, and powers navigation/search buttons.

## TripAdvisor via RapidAPI (Pricing & Ratings)
- **Config Keys**: `VITE_TRIPADVISOR_RAPIDAPI_KEY`, `VITE_TRIPADVISOR_RAPIDAPI_HOST`.
- **Request Logic**: `fetchPricingInsights()` in `src/services/locationInsights.ts`
  - Searches for TripAdvisor location IDs and fetches attraction details.
  - Returns ticket pricing lines, rating scores, review counts, and timestamps.
- **Downstream Usage**:
  - `journeyService.ts` writes pricing info to `slot.details.operational.pricing` and rating data to `slot.details.rating`.
- **UI Surface**: `TimeSlotCard.vue` displays rating chips, pricing lists, and TripAdvisor attribution inside the details collapse.

## Eventbrite (Festival & Event Listings)
- **Config Keys**: `VITE_EVENTBRITE_API_TOKEN`, `VITE_EVENTBRITE_API_URL`.
- **Request Logic**: `fetchFestivalEvents()` in `src/services/eventInsights.ts`
  - Pulls events within the journey date range and destination.
- **Downstream Usage**:
  - `journeyService.ts` attaches festival entries to `timeSlot.details.operational.events`.
- **UI Surface**: `TimeSlotCard.vue` shows festival highlight cards, updated-at labels, and optional subscription links.

## Unsplash / Pexels (Imagery)
- **Config Keys**: `VITE_UNSPLASH_ACCESS_KEY`, `VITE_PEXELS_API_KEY`.
- **Request Logic**: `src/services/unsplashAPI.ts`
  - `searchUnsplashPhoto(s)` fetches photos; on failure, falls back to Pexels via `searchPexelsPhotos()` (`src/services/pexelsAPI.ts`).
- **Downstream Usage**:
  - `poiSearchAPI.ts` decorates POI results with imagery.
  - Journey enrichment uses photos for inspiration cards and slot covers.
- **UI Surface**: `TimeSlotCard.vue` main image, list cards in `InspirationView.vue`.

## Google Directions (currently disabled)
- **Config Keys**: `VITE_GOOGLE_MAPS_API_KEY`.
- **Request Logic**: `fetchGoogleDirections()` in `locationInsights.ts` (commented out by default to avoid CORS in browser).
- **Potential Use**: Can be re-enabled for alternative transport insights if server-side proxying is available.

## Additional Notes
- All external credentials are pulled from environment variables; ensure they are available in build/deploy pipelines.
- `entrypoint.sh` optional vars (`SERVE_TOOL`, `SKIP_BUILD`, `SERVE_DIR`) do not affect API behavior but govern static asset delivery.
- When testing locally, guard against rate limits (TripAdvisor RapidAPI, Unsplash). Mock or stub responses for automated tests.***

