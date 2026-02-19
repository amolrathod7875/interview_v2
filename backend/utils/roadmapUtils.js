/**
 * Roadmap Utility Functions
 * Handles topic name to key conversion for Oracle bucket storage
 */

/**
 * Generate a URL-safe key from a topic name that handles special characters
 * like C++, C#, Node.js, etc.
 * 
 * @param {string} topic - The topic name (e.g., "C++ Programming", "Machine Learning")
 * @returns {string} - A URL-safe key (e.g., "c++-programming", "machine-learning")
 * 
 * Examples:
 * - "Machine Learning" -> "machine-learning"
 * - "C++ Programming" -> "c++-programming"
 * - "C# Development" -> "c#-development"
 * - "Node.js" -> "node.js"
 * - "React Native" -> "react-native"
 */
export const generateTopicKey = (topic) => {
  if (!topic || typeof topic !== 'string') {
    throw new Error('Topic must be a non-empty string')
  }

  // Trim and convert to lowercase
  let key = topic.toLowerCase().trim()

  // Replace spaces with hyphens
  key = key.replace(/\s+/g, '-')

  // Encode and decode to handle special characters safely
  // This preserves +, #, . and other special chars
  key = encodeURIComponent(key)
    .replace(/%20/g, '-')  // spaces already handled above, but keep for safety
    .replace(/%2B/g, '+')   // preserve +
    .replace(/%23/g, '#')   // preserve #
    .replace(/%2E/g, '.')   // preserve .
    .replace(/%40/g, '@')   // preserve @

  // Remove any remaining percent-encoded characters that are unsafe
  // Keep alphanumeric, hyphen, underscore, plus, hash, dot, at
  key = key.replace(/%[0-9A-Fa-f]{2}/g, '-')

  // Clean up multiple hyphens
  key = key.replace(/-+/g, '-')

  // Remove leading/trailing hyphens
  key = key.replace(/^-+|-+$/g, '')

  return key
}

/**
 * Validate that a topic key is safe for use as a bucket key
 * 
 * @param {string} key - The topic key to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTopicKey = (key) => {
  if (!key || typeof key !== 'string') return false
  
  // Only allow alphanumeric, hyphen, underscore, plus, hash, dot, at
  const safePattern = /^[a-z0-9\-_+.#@]+$/
  return safePattern.test(key) && key.length > 0 && key.length <= 255
}
