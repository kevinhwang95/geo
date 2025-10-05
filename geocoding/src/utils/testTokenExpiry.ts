/**
 * Test utility to simulate token expiry scenarios
 * This is for development/testing purposes only
 */

import { decodeJWT, isTokenExpired, getTokenTimeRemaining } from './jwt';

export function simulateTokenExpiry(token: string, minutesToSimulate: number = 60) {
  const payload = decodeJWT(token);
  if (!payload) {
    console.error('Invalid token provided');
    return null;
  }

  console.log('=== Token Expiry Simulation ===');
  console.log(`Original expiration: ${new Date(payload.exp * 1000).toLocaleString()}`);
  console.log(`Current time: ${new Date().toLocaleString()}`);
  console.log(`Time remaining: ${getTokenTimeRemaining(token)} seconds`);
  console.log(`Is expired: ${isTokenExpired(token)}`);
  
  // Simulate time passing
  const simulatedTime = Date.now() + (minutesToSimulate * 60 * 1000);
  const originalNow = Date.now;
  
  // Mock Date.now to simulate future time
  Date.now = () => simulatedTime;
  
  console.log(`\nAfter ${minutesToSimulate} minutes:`);
  console.log(`Simulated time: ${new Date(simulatedTime).toLocaleString()}`);
  console.log(`Time remaining: ${getTokenTimeRemaining(token)} seconds`);
  console.log(`Is expired: ${isTokenExpired(token)}`);
  
  // Restore original Date.now
  Date.now = originalNow;
  
  return {
    originalExpiration: payload.exp,
    timeRemaining: getTokenTimeRemaining(token),
    isExpired: isTokenExpired(token)
  };
}

export function createExpiredTokenForTesting() {
  // Create a mock JWT payload that's already expired
  const expiredPayload = {
    user_id: 1,
    role: 'user',
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    exp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago (expired)
    type: 'access'
  };

  // Create a mock JWT token (this won't be valid for API calls, just for testing)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(expiredPayload));
  const signature = 'mock_signature';
  
  return `${header}.${payload}.${signature}`;
}

export function createNearExpiryTokenForTesting() {
  // Create a mock JWT payload that expires in 2 minutes
  const nearExpiryPayload = {
    user_id: 1,
    role: 'user',
    iat: Math.floor(Date.now() / 1000) - 780, // 13 minutes ago
    exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes from now
    type: 'access'
  };

  // Create a mock JWT token (this won't be valid for API calls, just for testing)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(nearExpiryPayload));
  const signature = 'mock_signature';
  
  return `${header}.${payload}.${signature}`;
}

// Test function to run in browser console
(window as any).testTokenExpiry = simulateTokenExpiry;
(window as any).createExpiredToken = createExpiredTokenForTesting;
(window as any).createNearExpiryToken = createNearExpiryTokenForTesting;
