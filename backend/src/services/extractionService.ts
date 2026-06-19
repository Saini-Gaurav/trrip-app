import pdfParse from 'pdf-parse';
import { AppError } from '../middleware/errorHandler';

export class ExtractionService {
  async extractTextFromBuffer(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ text: string; fileType: 'pdf' | 'image' }> {
    if (mimeType === 'application/pdf') {
      return this.extractFromPdf(buffer);
    } else if (mimeType.startsWith('image/')) {
      return this.extractFromImage(buffer);
    } else {
      throw new AppError('Unsupported file type for extraction', 400);
    }
  }

  private async extractFromPdf(
    buffer: Buffer
  ): Promise<{ text: string; fileType: 'pdf' }> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (!text) {
        return { text: '[PDF contained no extractable text]', fileType: 'pdf' };
      }
      return { text, fileType: 'pdf' };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return { text: '[Failed to extract text from PDF]', fileType: 'pdf' };
    }
  }

  private async extractFromImage(
    buffer: Buffer
  ): Promise<{ text: string; fileType: 'image' }> {
    try {
      // Use Tesseract OCR for image text extraction
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();

      const cleaned = text.trim();
      return {
        text: cleaned || '[No text detected in image]',
        fileType: 'image',
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        text: '[Failed to extract text from image via OCR]',
        fileType: 'image',
      };
    }
  }

  // Convert buffer to base64 for Gemini Vision
  bufferToBase64(buffer: Buffer, mimeType: string): string {
    return buffer.toString('base64');
  }
}

export const extractionService = new ExtractionService();
