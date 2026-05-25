// chrome.storage.local is the only place the JWT lives. Never log it, never
// put it in a URL parameter, never expose it via window.

const TOKEN_KEY = "rezoomed.auth.token.v1";

export interface StoredToken {
  token: string;
  expiresAt: number; // unix seconds
  storedAt: number; // unix seconds
}

export async function readStoredToken(): Promise<StoredToken | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  const value = result[TOKEN_KEY] as StoredToken | undefined;
  return value ?? null;
}

export async function writeStoredToken(token: StoredToken): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearStoredToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}
