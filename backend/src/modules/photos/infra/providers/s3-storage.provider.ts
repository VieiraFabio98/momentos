import { Injectable } from '@nestjs/common'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'node:stream'
import { IObjectMetadata, IStorageProvider } from '../../domain/providers/i-storage-provider'

const UPLOAD_URL_TTL_SECONDS = 300
const DOWNLOAD_URL_TTL_SECONDS = 3600

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client = new S3Client({ region: process.env.AWS_REGION })
  private readonly bucket = process.env.S3_BUCKET_NAME

  getUploadUrl(key: string, contentType: string, size: number): Promise<string> {
    // ContentLength entra nos headers assinados: o cliente é obrigado a enviar
    // exatamente esse tamanho, senão o S3 rejeita a requisição
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(['content-length']) },
    )
  }

  getDownloadUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    )
  }

  getAttachmentUrl(key: string, filename: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    )
  }

  async getObjectStream(key: string): Promise<Readable> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    )
    return result.Body as Readable
  }

  async getObjectMetadata(key: string): Promise<IObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      return {
        size: result.ContentLength ?? 0,
        contentType: result.ContentType ?? '',
      }
    } catch {
      return null
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    // DeleteObjectsCommand accepts at most 1000 keys per request
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000)
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: batch.map((key) => ({ Key: key })) },
        }),
      )
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    let deleted = 0
    let continuationToken: string | undefined

    // o ListObjectsV2 já devolve no máximo 1000 chaves por página, que é
    // exatamente o teto do DeleteObjects — uma página, uma exclusão
    do {
      const listed = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      )

      const keys = (listed.Contents ?? []).map((object) => ({ Key: object.Key! }))
      if (keys.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys } }),
        )
        deleted += keys.length
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } while (continuationToken)

    return deleted
  }
}
