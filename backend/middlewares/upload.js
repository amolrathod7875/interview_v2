import multer from 'multer'
import multerS3 from 'multer-s3'
import { s3 } from '../config/s3.js'
import dotenv from 'dotenv'
dotenv.config()

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_, file, cb) => {
      const filename = `${Date.now()}-${file.originalname}`
      cb(null, filename)
    }
  })
})
