import { S3Client } from '@aws-sdk/client-s3'
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
