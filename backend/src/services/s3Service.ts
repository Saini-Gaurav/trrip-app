import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client, { S3_BUCKET_NAME } from '../config/s3';
import { generateS3Key } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';

export class S3Service {
  async uploadFile(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ s3Key: string; s3Url: string }> {
    const s3Key = generateS3Key(userId, file.originalname);

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: `inline; filename="${encodeURIComponent(file.originalname)}"`,
          Metadata: {
            userId,
            originalName: file.originalname,
          },
        })
      );

      const s3Url = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
      return { s3Key, s3Url };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new AppError('Failed to upload file to storage', 500);
    }
  }

  async deleteFile(s3Key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: s3Key,
        })
      );
    } catch (error) {
      console.error('S3 delete error:', error);
      // Non-critical – log but don't throw
    }
  }

  async getSignedDownloadUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      });
      return getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new AppError('Failed to generate download URL', 500);
    }
  }

  async getFileBuffer(s3Key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      });
      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];
      if (response.Body) {
        // @ts-expect-error S3 stream reading
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('S3 get file error:', error);
      throw new AppError('Failed to retrieve file from storage', 500);
    }
  }
}

export const s3Service = new S3Service();
