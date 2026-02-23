# AWS to Oracle Cloud Migration Plan

## Overview

This plan migrates the file storage component from AWS S3 to Oracle Cloud Infrastructure (OCI) Object Storage while keeping the frontend on Vercel and backend on Render/Railway.

## Current Architecture

```
Frontend (Vercel) → Backend (Render/Railway) → AWS S3 (resumes-ai-interview)
                                              → MongoDB Atlas
```

## Target Architecture

```
Frontend (Vercel) → Backend (Render) → Oracle Object Storage
                                              → MongoDB Atlas
```

## Migration Steps

### Phase 1: Oracle Cloud Setup

#### 1. Set Up Oracle Cloud Account
- Create an Oracle Cloud Free Tier account at [cloud.oracle.com](https://cloud.oracle.com)
- Navigate to Object Storage > Create Bucket
- Create a new bucket named `resumes-ai-interview` (or similar)
- Note the namespace (auto-generated)

#### 2. Generate API Keys
1. Go to Oracle Cloud Console > Identity > Users
2. Select your user > API Keys
3. Add API Key > Generate API Key Pair
4. Download the private key (save securely)
5. Copy the key fingerprint
6. Get Tenancy OCID and User OCID from Oracle Cloud console

#### 3. Create OCI Configuration
Create file at `~/.oci/config`:
```
[DEFAULT]
user=ocid1.user.oc1..xxxxxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx
key_file=path/to/private_key.pem
tenancy=ocid1.tenancy.oc1..xxxxxxxx
region=us-ashburn-1
```

---

### Phase 2: Backend Configuration

#### 4. Install Oracle Cloud SDK
```bash
cd backend
npm install @oracle/oci-sdk
```

Or use S3-compatible SDK:
```bash
npm install @aws-sdk/client-s3
```

#### 5. Create Oracle Storage Configuration
Create new file: `backend/config/oracleStorage.js`

```javascript
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

export const oracleStorage = new S3Client({
  endpoint: process.env.ORACLE_ENDPOINT || 'https://<namespace>.compat.objectstorage.us-ashburn-1.oraclecloud.com',
  region: process.env.ORACLE_REGION || 'us-ashburn-1',
  credentials: {
    accessKeyId: process.env.ORACLE_ACCESS_KEY_ID,  // This is your Oracle User ID
    secretAccessKey: process.env.ORACLE_SECRET_ACCESS_KEY  // Your private key
  }
});
```

#### 6. Update Environment Variables
Add to `backend/.env`:
```
# Oracle Cloud Object Storage (replace AWS S3)
ORACLE_ENDPOINT=https://<your-namespace>.compat.objectstorage.us-ashburn-1.oraclecloud.com
ORACLE_REGION=us-ashburn-1
ORACLE_ACCESS_KEY_ID=your_oracle_access_key
ORACLE_SECRET_ACCESS_KEY=your_oracle_secret_key
ORACLE_BUCKET=resumes-ai-interview

# Keep AWS vars temporarily for migration (remove after verification)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...
# AWS_BUCKET=...
```

#### 7. Update Upload Middleware
Modify `backend/middlewares/upload.js`:
- Support both AWS S3 and Oracle Cloud storage
- Use environment variable to toggle between providers

---

### Phase 3: Data Migration

#### 8. Migrate Existing Files
Create a migration script `backend/scripts/migrateToOracle.js`:
- Download all files from AWS S3 bucket
- Upload to Oracle Object Storage
- Update database references if needed

```javascript
// Migration script structure
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@oracle/oci-sdk/lib/commands/put-object-command';

// 1. List all objects in AWS S3
// 2. For each object:
//    - Download from S3
//    - Upload to Oracle
//    - Log new URL
```

---

### Phase 4: Testing & Deployment

#### 9. Local Testing
- Set environment variables
- Test file uploads
- Verify file retrieval
- Check all file-dependent features work

#### 10. Update Deployment Configuration
For **Render/Railway**:
- Add Oracle Cloud environment variables
- Keep AWS vars temporarily
- Redeploy backend

#### 11. Production Verification
- Test file upload functionality
- Verify existing files are accessible
- Monitor for any errors

#### 12. Cleanup
- Remove AWS S3 configuration from code
- Remove AWS environment variables
- Delete AWS S3 bucket (after confirming everything works)

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `ORACLE_ENDPOINT` | Object Storage endpoint | `https://namespace.compat.objectstorage.region.oraclecloud.com` |
| `ORACLE_REGION` | OCI region | `us-ashburn-1` |
| `ORACLE_ACCESS_KEY_ID` | User OCID or access key | `ocid1.user.oc1..xxxx` |
| `ORACLE_SECRET_ACCESS_KEY` | Private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `ORACLE_BUCKET` | Bucket name | `resumes-ai-interview` |

---

## Important Notes

1. **S3 Compatibility**: Oracle Object Storage is S3-compatible, so minimal code changes are needed
2. **Key Format**: Oracle uses PEM format private keys
3. **Endpoint URL**: Includes your tenancy namespace
4. **Region**: Choose the region closest to your users

## Rollback Plan

If issues occur:
1. Keep AWS credentials in environment variables
2. Revert code changes in upload middleware
3. Switch back to AWS S3 temporarily
4. Investigate and retry

---

## Estimated Timeline

- Oracle Cloud Setup: ~30 minutes
- Backend Configuration: ~1 hour  
- Data Migration: Depends on file volume
- Testing & Deployment: ~1 hour

**Total: 2-3 hours**
