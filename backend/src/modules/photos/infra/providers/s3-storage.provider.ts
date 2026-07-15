import { Injectable } from '@nestjs/common'
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { IStorageProvider } from '../../domain/providers/i-storage-provider'

const UPLOAD_URL_TTL_SECONDS = 300
const DOWNLOAD_URL_TTL_SECONDS = 3600

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client = new S3Client({ region: process.env.AWS_REGION })
  private readonly bucket = process.env.S3_BUCKET_NAME

  getUploadUrl(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    )
  }

  getDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    )
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return true
    } catch {
      return false
    }
  }
}
