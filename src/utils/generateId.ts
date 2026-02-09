/**
 * Generate a unique ID
 * 
 * Uses uuid v4 when crypto is available, falls back to timestamp-based ID otherwise.
 */

let uuidv4: (() => string) | null = null;

// Try to import uuid - it may fail if crypto polyfill isn't available
try {
  // Dynamic require to catch errors at runtime
  const uuid = require('uuid');
  uuidv4 = uuid.v4;
} catch {
  uuidv4 = null;
}

/**
 * Fallback ID generator using timestamp and random values
 * Generates IDs in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const generateFallbackId = (): string => {
  const timestamp = Date.now().toString(16);
  const randomPart = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  
  return [
    timestamp.slice(-8).padStart(8, '0'),
    randomPart(),
    '4' + randomPart().slice(1),
    ((Math.random() * 4 | 8)).toString(16) + randomPart().slice(1),
    randomPart() + randomPart() + randomPart(),
  ].join('-');
};

/**
 * Generate a unique ID
 * Uses uuid v4 when available, falls back to timestamp-based generation
 */
export const generateId = (): string => {
  if (uuidv4) {
    try {
      return uuidv4();
    } catch {
      // Fall through to fallback
    }
  }
  return generateFallbackId();
};
