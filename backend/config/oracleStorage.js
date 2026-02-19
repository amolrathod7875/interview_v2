import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'
dotenv.config()

// Oracle Cloud Object Storage S3-compatible client
export const oracleStorage = new S3Client({
  endpoint: process.env.ORACLE_ENDPOINT,
  region: process.env.ORACLE_REGION || 'us-ashburn-1',
  credentials: {
    accessKeyId: process.env.ORACLE_ACCESS_KEY_ID,
    secretAccessKey: process.env.ORACLE_SECRET_ACCESS_KEY
  },
  forcePathStyle: true // Required for Oracle Cloud S3-compatible API
})

export const oracleBucket = process.env.ORACLE_BUCKET

// Helper function to get Oracle S3 upload parameters
export const getOracleUploadParams = (key, contentType) => ({
  Bucket: oracleBucket,
  Key: key,
  ContentType: contentType
})

// ============================================
// Roadmap Caching Helper Functions
// ============================================

const ROADMAP_PREFIX = 'roadmaps/'

/**
 * Check if a roadmap exists in Oracle bucket
 * @param {string} topicKey - The topic key (slug)
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
export const checkRoadmapExists = async (topicKey) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: oracleBucket,
      Key: `${ROADMAP_PREFIX}${topicKey}.json`
    })
    await oracleStorage.send(command)
    return true
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error // Re-throw other errors
  }
}

/**
 * Get a roadmap from Oracle bucket
 * @param {string} topicKey - The topic key (slug)
 * @returns {Promise<object|null>} - Roadmap object or null if not found
 */
export const getRoadmap = async (topicKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: oracleBucket,
      Key: `${ROADMAP_PREFIX}${topicKey}.json`
    })
    const response = await oracleStorage.send(command)
    
    // Convert stream to string
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    const jsonString = Buffer.concat(chunks).toString('utf-8')
    return JSON.parse(jsonString)
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null
    }
    throw error
  }
}

/**
 * Save a roadmap to Oracle bucket
 * @param {string} topicKey - The topic key (slug)
 * @param {object} roadmapData - The roadmap data to save
 * @returns {Promise<string>} - The URL of the saved file
 */
export const saveRoadmap = async (topicKey, roadmapData) => {
  const command = new PutObjectCommand({
    Bucket: oracleBucket,
    Key: `${ROADMAP_PREFIX}${topicKey}.json`,
    Body: JSON.stringify(roadmapData, null, 2),
    ContentType: 'application/json'
  })
  
  await oracleStorage.send(command)
  
  // Generate Oracle URL
  return `${process.env.ORACLE_ENDPOINT}/${oracleBucket}/${ROADMAP_PREFIX}${topicKey}.json`
}
