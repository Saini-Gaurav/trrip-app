import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Use memory storage; S3 upload handled in service
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed (JPEG, PNG, WebP, GIF)'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // Max 5 files at once
  },
});

export const generateS3Key = (
  userId: string,
  originalName: string
): string => {
  const ext = originalName.split('.').pop();
  const uuid = uuidv4();
  return `documents/${userId}/${uuid}.${ext}`;
};
