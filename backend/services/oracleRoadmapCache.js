/**
 * Oracle Cloud Roadmap Cache Service
 * 
 * Handles caching of generated roadmaps in Oracle Cloud Object Storage
 * to reduce API costs by avoiding redundant AI generation.
 * 
 * Features:
 * - Cache roadmaps by normalized topic name
 * - Fetch full roadmap or specific difficulty level
 * - Cache metadata (timestamp, hit count)
 * - TTL support for cache expiration
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { oracleStorage, oracleBucket } from '../config/oracleStorage.js'

// Cache configuration
const CACHE_PREFIX = 'roadmaps/'
const CACHE_EXPIRY_DAYS = 30 // Cache expires after 30 days
const DEFAULT_CONTENT_TYPE = 'application/json'

/**
 * Generate a normalized cache key from topic
 * @param {string} topic - Raw topic input
 * @returns {string} Normalized key (e.g., "Python" -> "python", "Machine Learning" -> "machine-learning")
 */
export const generateCacheKey = (topic) => {
    if (!topic) return null
    
    // Normalize: lowercase, trim, replace spaces with hyphens, remove special chars
    return topic
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-') // Remove duplicate hyphens
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate full Oracle object key with prefix
 * @param {string} topic - Normalized topic
 * @returns {string} Full Oracle object key
 */
export const getOracleObjectKey = (topic) => {
    const normalizedKey = generateCacheKey(topic)
    return normalizedKey ? `${CACHE_PREFIX}${normalizedKey}.json` : null
}

/**
 * Check if a cached roadmap exists in Oracle Cloud
 * @param {string} topic - Topic to check
 * @returns {Promise<boolean>} True if cached roadmap exists
 */
export const isRoadmapCached = async (topic) => {
    try {
        const objectKey = getOracleObjectKey(topic)
        if (!objectKey) return false

        const command = new HeadObjectCommand({
            Bucket: oracleBucket,
            Key: objectKey
        })

        await oracleStorage.send(command)
        return true
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false
        }
        // Log other errors but don't throw - let caller handle
        console.warn('[ORACLE CACHE] Error checking cache:', error.message)
        return false
    }
}

/**
 * Get roadmap from Oracle Cloud cache
 * @param {string} topic - Topic to fetch
 * @param {string} level - Optional: filter by level (beginner/intermediate/advanced)
 * @returns {Promise<object|null>} Cached roadmap or null if not found
 */
export const getRoadmapFromOracle = async (topic, level = null) => {
    try {
        const objectKey = getOracleObjectKey(topic)
        if (!objectKey) {
            console.warn('[ORACLE CACHE] Invalid topic for cache key')
            return null
        }

        const command = new GetObjectCommand({
            Bucket: oracleBucket,
            Key: objectKey
        })

        const response = await oracleStorage.send(command)
        
        // Convert stream to string
        const chunks = []
        for await (const chunk of response.Body) {
            chunks.push(chunk)
        }
        const bodyString = Buffer.concat(chunks).toString('utf-8')
        
        const roadmapData = JSON.parse(bodyString)
        
        // If level specified, return only that level
        if (level && roadmapData[level]) {
            return {
                [level]: roadmapData[level],
                _meta: {
                    cached: true,
                    source: 'oracle',
                    topic: topic,
                    cachedAt: roadmapData._meta?.cachedAt || new Date().toISOString()
                }
            }
        }

        // Return full roadmap with metadata
        return {
            ...roadmapData,
            _meta: {
                cached: true,
                source: 'oracle',
                topic: topic,
                cachedAt: roadmapData._meta?.cachedAt || new Date().toISOString()
            }
        }
    } catch (error) {
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
            console.log(`[ORACLE CACHE] No cached roadmap found for: ${topic}`)
            return null
        }
        console.error('[ORACLE CACHE] Error fetching roadmap:', error.message)
        return null
    }
}

/**
 * Save roadmap to Oracle Cloud cache
 * @param {string} topic - Topic for the roadmap
 * @param {object} roadmap - Roadmap data
 * @returns {Promise<boolean>} True if saved successfully
 */
export const saveRoadmapToOracle = async (topic, roadmap) => {
    try {
        const objectKey = getOracleObjectKey(topic)
        if (!objectKey) {
            console.error('[ORACLE CACHE] Invalid topic for cache key')
            return false
        }

        // Add metadata to roadmap
        const roadmapWithMeta = {
            ...roadmap,
            _meta: {
                topic: topic,
                cachedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
                version: '1.0'
            }
        }

        const command = new PutObjectCommand({
            Bucket: oracleBucket,
            Key: objectKey,
            Body: JSON.stringify(roadmapWithMeta, null, 2),
            ContentType: DEFAULT_CONTENT_TYPE
        })

        await oracleStorage.send(command)
        
        console.log(`[ORACLE CACHE] Roadmap saved for topic: ${topic}`)
        return true
    } catch (error) {
        console.error('[ORACLE CACHE] Error saving roadmap:', error.message)
        return false
    }
}

/**
 * Check if cached roadmap has expired
 * @param {object} roadmapData - Roadmap data with metadata
 * @returns {boolean} True if expired
 */
export const isRoadmapExpired = (roadmapData) => {
    if (!roadmapData._meta?.expiresAt) {
        return false // No expiry set, never expires
    }
    
    const expiresAt = new Date(roadmapData._meta.expiresAt)
    return expiresAt < new Date()
}

/**
 * Delete cached roadmap from Oracle Cloud
 * @param {string} topic - Topic to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteRoadmapFromCache = async (topic) => {
    try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
        
        const objectKey = getOracleObjectKey(topic)
        if (!objectKey) return false

        const command = new DeleteObjectCommand({
            Bucket: oracleBucket,
            Key: objectKey
        })

        await oracleStorage.send(command)
        
        console.log(`[ORACLE CACHE] Roadmap deleted for topic: ${topic}`)
        return true
    } catch (error) {
        console.error('[ORACLE CACHE] Error deleting roadmap:', error.message)
        return false
    }
}

/**
 * Get cache statistics for a topic
 * @param {string} topic - Topic to check
 * @returns {Promise<object|null>} Cache metadata or null
 */
export const getCacheMetadata = async (topic) => {
    try {
        const objectKey = getOracleObjectKey(topic)
        if (!objectKey) return null

        const command = new HeadObjectCommand({
            Bucket: oracleBucket,
            Key: objectKey
        })

        const response = await oracleStorage.send(command)
        
        return {
            lastModified: response.LastModified,
            size: response.ContentLength,
            contentType: response.ContentType,
            objectKey: objectKey
        }
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return null
        }
        console.warn('[ORACLE CACHE] Error getting metadata:', error.message)
        return null
    }
}

export default {
    generateCacheKey,
    getOracleObjectKey,
    isRoadmapCached,
    getRoadmapFromOracle,
    saveRoadmapToOracle,
    isRoadmapExpired,
    deleteRoadmapFromCache,
    getCacheMetadata
}
