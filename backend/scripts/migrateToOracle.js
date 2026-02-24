/**
 * Migration Script: AWS S3 to Oracle Cloud Object Storage
 * 
 * This script migrates all files from AWS S3 bucket to Oracle Cloud Object Storage.
 * 
 * Prerequisites:
 * 1. Set Oracle Cloud environment variables in .env
 * 2. Ensure both AWS and Oracle buckets are accessible
 * 
 * Usage: node scripts/migrateToOracle.js
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { oracleStorage, oracleBucket } from '../config/oracleStorage.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

dotenv.config()

// AWS S3 client
const awsS3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const awsBucket = process.env.AWS_BUCKET

async function listAllObjects(s3Client, bucket) {
  const objects = []
  let continuationToken = null

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken
    })

    const response = await s3Client.send(command)
    
    if (response.Contents) {
      objects.push(...response.Contents)
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return objects
}

async function downloadObject(s3Client, bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  })

  const response = await s3Client.send(command)
  
  // Convert stream to buffer
  const chunks = []
  for await (const chunk of response.Body) {
    chunks.push(chunk)
  }
  
  return {
    body: Buffer.concat(chunks),
    contentType: response.ContentType
  }
}

async function uploadToOracle(key, buffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: oracleBucket,
    Key: key,
    Body: buffer,
    ContentType: contentType
  })

  await oracleStorage.send(command)
  
  // Generate Oracle URL
  const url = `${process.env.ORACLE_ENDPOINT}/${oracleBucket}/${key}`
  return url
}

async function migrateFiles() {
  console.log('='.repeat(50))
  console.log('AWS S3 to Oracle Cloud Migration')
  console.log('='.repeat(50))
  console.log(`Source: AWS S3 - ${awsBucket}`)
  console.log(`Destination: Oracle Object Storage - ${oracleBucket}`)
  console.log('='.repeat(50))

  // Check if Oracle is configured
  if (!oracleBucket || !process.env.ORACLE_ENDPOINT) {
    console.error('ERROR: Oracle Cloud credentials not configured')
    console.log('Please set ORACLE_ENDPOINT, ORACLE_ACCESS_KEY_ID, ORACLE_SECRET_ACCESS_KEY, and ORACLE_BUCKET in .env')
    process.exit(1)
  }

  try {
    // List all objects in AWS S3
    console.log('\nFetching list of objects from AWS S3...')
    const objects = await listAllObjects(awsS3, awsBucket)
    
    console.log(`Found ${objects.length} files to migrate`)
    
    if (objects.length === 0) {
      console.log('No files to migrate.')
      return
    }

    // Migrate each file
    let successCount = 0
    let errorCount = 0

    for (const obj of objects) {
      const key = obj.Key
      const size = obj.Size
      
      try {
        console.log(`\nMigrating: ${key} (${formatBytes(size)})`)
        
        // Download from AWS
        const { body, contentType } = await downloadObject(awsS3, awsBucket, key)
        
        // Upload to Oracle
        const oracleUrl = await uploadToOracle(key, body, contentType)
        
        console.log(`   Uploaded to: ${oracleUrl}`)
        successCount++
        
      } catch (error) {
        console.error(`   Error: ${error.message}`)
        errorCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('Migration Summary')
    console.log('='.repeat(50))
    console.log(`Total files: ${objects.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${errorCount}`)
    console.log('='.repeat(50))

    if (errorCount > 0) {
      console.log('\nSome files failed to migrate. Check errors above.')
      process.exit(1)
    }

    console.log('\n Migration completed successfully!')
    console.log('You can now switch to Oracle Cloud by:')
    console.log('1. Updating your production environment variables')
    console.log('2. Removing AWS credentials from deployment')
    console.log('3. Deleting the AWS S3 bucket (optional)')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Run migration
migrateFiles()
