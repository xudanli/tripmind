import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import {
  ItineraryLLMSchema,
  PlannerItineraryResponseSchema,
  type ItineraryLLM,
  type PlannerItineraryApp
} from '@/schemas/itinerarySchema'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

ajv.addKeyword({
  keyword: 'minWords',
  type: 'string',
  errors: true,
  metaSchema: { type: 'number', minimum: 1 },
  validate(min: number, data: string) {
    if (typeof data !== 'string') return false
    const words = data.trim().split(/\s+/).filter(Boolean).length
    return words >= min
  }
})

const ItineraryLLMSchemaWithWords = {
  ...ItineraryLLMSchema,
  properties: {
    ...ItineraryLLMSchema.properties,
    summary: {
      ...ItineraryLLMSchema.properties.summary,
      minWords: 100
    },
    days: {
      ...ItineraryLLMSchema.properties.days,
      items: {
        ...ItineraryLLMSchema.properties.days.items,
        properties: {
          ...ItineraryLLMSchema.properties.days.items.properties,
          activities: {
            ...ItineraryLLMSchema.properties.days.items.properties.activities,
            items: {
              ...ItineraryLLMSchema.properties.days.items.properties.activities.items,
              properties: {
                ...ItineraryLLMSchema.properties.days.items.properties.activities.items.properties,
                notes: {
                  ...ItineraryLLMSchema.properties.days.items.properties.activities.items.properties.notes,
                  minWords: 40
                }
              }
            }
          }
        }
      }
    }
  }
}

const validateLLM = ajv.compile(ItineraryLLMSchemaWithWords as any)
const validateApp = ajv.compile(PlannerItineraryResponseSchema as any)

export function validateLLMJson(obj: unknown): { valid: boolean; errors?: string[] } {
  const ok = validateLLM(obj)
  return ok
    ? { valid: true }
    : { valid: false, errors: formatAjvErrors(validateLLM.errors) }
}

export function validateAppItinerary(obj: unknown): { valid: boolean; errors?: string[] } {
  const ok = validateApp(obj)
  return ok
    ? { valid: true }
    : { valid: false, errors: formatAjvErrors(validateApp.errors) }
}

export function formatAjvErrors(errors?: ErrorObject[] | null): string[] {
  if (!errors?.length) return []
  return errors.map((err) => `${err.instancePath || '/'} ${err.message ?? ''}`.trim())
}

export function sanitizeLLMJson<T extends ItineraryLLM>(data: T): T {
  try {
    const padTime = (value: string) => {
      const match = value.match(/^(\d{1,2}):(\d{2})$/)
      if (!match || typeof match[1] === 'undefined' || typeof match[2] === 'undefined') {
        return value
      }
      const hours = match[1].padStart(2, '0')
      return `${hours}:${match[2]}`
    }

    data.days?.forEach((day) => {
      day.activities?.forEach((activity) => {
        if (typeof activity.time === 'string') {
          activity.time = padTime(activity.time)
        }
        if (activity.location) {
          if (typeof activity.location.lat === 'number') {
            activity.location.lat = Math.max(-90, Math.min(90, activity.location.lat))
          }
          if (typeof activity.location.lng === 'number') {
            activity.location.lng = Math.max(-180, Math.min(180, activity.location.lng))
          }
        }
        if (typeof activity.duration === 'number' && activity.duration < 1) {
          activity.duration = 1
        }
        if (typeof activity.cost === 'number' && activity.cost < 0) {
          activity.cost = 0
        }
        if (activity.transport) {
          if (typeof activity.transport.duration === 'number' && activity.transport.duration < 1) {
            activity.transport.duration = 1
          }
        }
      })
    })
  } catch {
    // swallow errors to keep sanitation best-effort
  }
  return data
}

export type { ItineraryLLM, PlannerItineraryApp }

