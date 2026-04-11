export type PaddleEnvironmentName = 'sandbox' | 'production'

export function getRequestedPaddleEnvironmentName(): PaddleEnvironmentName {
  return process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox'
}

export function getPaddleConfigurationError(params: {
  environment: PaddleEnvironmentName
  apiKey?: string | null
  clientToken?: string | null
}) {
  const apiKey = params.apiKey?.trim()
  const clientToken = params.clientToken?.trim()

  if (!apiKey) {
    return 'PADDLE_API_KEY is not set.'
  }

  if (!clientToken) {
    return 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set.'
  }

  if (params.environment === 'production' && apiKey.startsWith('pdl_sdbx_')) {
    return 'Paddle is set to production but PADDLE_API_KEY is a sandbox key.'
  }

  if (params.environment === 'sandbox' && apiKey.startsWith('pdl_live_')) {
    return 'Paddle is set to sandbox but PADDLE_API_KEY is a live key.'
  }

  if (params.environment === 'production' && clientToken.startsWith('test_')) {
    return 'Paddle is set to production but NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is a test token.'
  }

  if (params.environment === 'sandbox' && clientToken.startsWith('live_')) {
    return 'Paddle is set to sandbox but NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is a live token.'
  }

  return null
}
