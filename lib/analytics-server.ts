import { PostHog } from 'posthog-node'
import type { AnalyticsEventMap, AnalyticsEventName, AnalyticsIdentifyTraits } from './analytics'

let posthogClient: PostHog | null = null

function getPostHogClient() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!apiKey) {
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    })
  }

  return posthogClient
}

export async function captureServerAnalyticsEvent<E extends AnalyticsEventName>(
  distinctId: string,
  event: E,
  properties: AnalyticsEventMap[E]
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId,
      event,
      properties,
    })
    await client.flush()
  } catch {
    // Analytics failures must never break the product flow.
  }
}

export async function identifyServerAnalyticsUser(
  distinctId: string,
  properties: AnalyticsIdentifyTraits
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.identify({
      distinctId,
      properties,
    })
    await client.flush()
  } catch {
    // Analytics failures must never break the product flow.
  }
}

