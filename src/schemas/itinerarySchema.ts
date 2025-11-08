import { Type, type Static } from '@sinclair/typebox'

export const GeoPoint = Type.Object({
  lat: Type.Number({ minimum: -90, maximum: 90 }),
  lng: Type.Number({ minimum: -180, maximum: 180 })
})

export const Transport = Type.Object({
  mode: Type.Union([
    Type.Literal('walk'),
    Type.Literal('bus'),
    Type.Literal('metro'),
    Type.Literal('taxi'),
    Type.Literal('ridehail'),
    Type.Literal('train'),
    Type.Literal('ferry'),
    Type.Literal('drive')
  ]),
  from: Type.String({ minLength: 1 }),
  to: Type.String({ minLength: 1 }),
  duration: Type.Integer({ minimum: 1 }),
  notes: Type.String({ minLength: 1 })
})

export const ActivityLLM = Type.Object({
  time: Type.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  title: Type.String({ minLength: 1 }),
  type: Type.String({ minLength: 1 }),
  duration: Type.Integer({ minimum: 1 }),
  location: GeoPoint,
  notes: Type.String({ minLength: 1, maxLength: 4000 }),
  localTip: Type.String({ minLength: 1 }),
  transport: Transport,
  cost: Type.Number({ minimum: 0 })
})

export const DayLLM = Type.Object({
  day: Type.Integer({ minimum: 1 }),
  date: Type.String({ minLength: 1 }),
  theme: Type.String({ minLength: 1 }),
  mood: Type.String({ minLength: 1 }),
  summary: Type.String({ minLength: 1 }),
  activities: Type.Array(ActivityLLM, { minItems: 1 })
})

export const ItineraryLLMSchema = Type.Object({
  schemaVersion: Type.Optional(Type.String()),
  title: Type.String({ minLength: 1 }),
  destination: Type.String({ minLength: 1 }),
  duration: Type.Integer({ minimum: 1 }),
  totalCost: Type.Number({ minimum: 0 }),
  currencyHint: Type.Optional(Type.String()),
  summary: Type.String({ minLength: 1 }),
  days: Type.Array(DayLLM, { minItems: 1 }),
  recommendations: Type.Object({
    bestTimeToVisit: Type.String(),
    weatherAdvice: Type.String(),
    packingTips: Type.Array(Type.String()),
    localTips: Type.Array(Type.String()),
    emergencyContacts: Type.Array(Type.String())
  }),
  aiInsights: Type.Object({
    optimizationSuggestions: Type.Array(Type.String()),
    alternativeActivities: Type.Array(Type.String()),
    budgetOptimization: Type.Array(Type.String()),
    culturalNotes: Type.Array(Type.String())
  })
})

export type ItineraryLLM = Static<typeof ItineraryLLMSchema>

export const TimeSlotApp = Type.Object({
  time: Type.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  activity: Type.String({ minLength: 1 }),
  location: Type.String(),
  icon: Type.String(),
  category: Type.String(),
  categoryColor: Type.String(),
  notes: Type.String(),
  estimatedDuration: Type.Integer({ minimum: 0 }),
  estimatedCost: Type.Number({ minimum: 0 }),
  coordinates: Type.Optional(GeoPoint)
})

export const DayApp = Type.Object({
  date: Type.String({ minLength: 1 }),
  title: Type.String({ minLength: 1 }),
  description: Type.String(),
  status: Type.Union([
    Type.Literal('planned'),
    Type.Literal('in-progress'),
    Type.Literal('completed')
  ]),
  stats: Type.Object({
    duration: Type.Integer({ minimum: 0 }),
    cost: Type.Number({ minimum: 0 })
  }),
  timeSlots: Type.Array(TimeSlotApp)
})

export const PlannerItineraryResponseSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  destination: Type.String({ minLength: 1 }),
  duration: Type.Integer({ minimum: 1 }),
  totalCost: Type.Number({ minimum: 0 }),
  summary: Type.String(),
  days: Type.Array(DayApp),
  recommendations: Type.Object({
    bestTimeToVisit: Type.String(),
    weatherAdvice: Type.String(),
    packingTips: Type.Array(Type.String()),
    localTips: Type.Array(Type.String()),
    emergencyContacts: Type.Array(Type.String())
  }),
  aiInsights: Type.Object({
    optimizationSuggestions: Type.Array(Type.String()),
    alternativeActivities: Type.Array(Type.String()),
    budgetOptimization: Type.Array(Type.String()),
    culturalNotes: Type.Array(Type.String())
  })
})

export type PlannerItineraryApp = Static<typeof PlannerItineraryResponseSchema>

