export function getPaddleConfigurationError(
  _opts?: { environment?: string; apiKey?: string; clientToken?: string }
): string {
  return 'Paddle is disabled — using PayPal instead.'
}
