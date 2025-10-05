/**
 * Utility functions for JWT token handling
 */

export interface JWTPayload {
  user_id: number;
  role: string;
  iat: number; // issued at
  exp: number; // expiration time
  type: 'access' | 'refresh';
}

/**
 * Decode JWT token payload without verification (client-side only)
 * Note: This is for getting expiration time, not for security validation
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  const payload = decodeJWT(token);
  if (!payload) {
    return true; // Consider invalid tokens as expired
  }

  const now = Math.floor(Date.now() / 1000);
  return now >= (payload.exp - bufferSeconds);
}

/**
 * Get the number of seconds until token expiration
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = decodeJWT(token);
  if (!payload) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Get the number of seconds until token expiration with buffer
 */
export function getTokenTimeRemainingWithBuffer(token: string, bufferSeconds: number = 120): number {
  const payload = decodeJWT(token);
  if (!payload) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now - bufferSeconds);
}
