import multer from 'multer'
import multerS3 from 'multer-s3'
import { s3 } from '../config/s3.js'
import { oracleStorage, oracleBucket } from '../config/oracleStorage.js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
dotenv.config()

// Determine which storage to use: Oracle Cloud > AWS S3 > Local
let storage;

// Priority 1: Oracle Cloud Object Storage (if configured)
if (process.env.ORACLE_BUCKET && process.env.ORACLE_ENDPOINT && process.env.ORACLE_ACCESS_KEY_ID) {
  console.log('Using Oracle Cloud Object Storage')
  storage = multerS3({
    s3: oracleStorage,
    bucket: process.env.ORACLE_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`
      cb(null, filename)
    },
    // Generate public URL for Oracle Cloud
    url: (req, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`
      const url = `${process.env.ORACLE_ENDPOINT}/${process.env.ORACLE_BUCKET}/${filename}`
      cb(null, url)
    }
  });
}
// Priority 2: AWS S3 (if configured)
else if (process.env.AWS_BUCKET && s3) {
  console.log('Using AWS S3')
  storage = multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`
      cb(null, filename)
    }
  });
}
// Priority 3: Local disk storage (fallback)
else {
  console.log('Using local disk storage')
  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads', 'files');
  fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const filename = `${Date.now()}-${file.originalname}`;
      cb(null, filename);
    }
  });
}

export const upload = multer({ storage });
