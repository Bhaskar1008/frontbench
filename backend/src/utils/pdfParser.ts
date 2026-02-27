/**
 * PDF Parser Wrapper
 * Handles pdf-parse module loading issues gracefully
 */

export interface PDFParseResult {
  text: string;
  numpages: number;
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  };
  metadata?: any;
}

/**
 * Parse PDF buffer with error handling for pdf-parse module issues
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    // Try to dynamically import pdf-parse
    // This may fail due to pdf-parse's internal test file loading bug
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    const result = await pdfParse(buffer);
    return result as PDFParseResult;
  } catch (error: any) {
    // If error is about test file, try to work around it
    if (error.message?.includes('05-versions-space.pdf') || error.code === 'ENOENT') {
      // Retry with a workaround - set process.env to prevent debug mode
      const originalEnv = process.env.NODE_ENV;
      try {
        // Temporarily set NODE_ENV to production to disable debug mode
        process.env.NODE_ENV = 'production';
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const result = await pdfParse(buffer);
        process.env.NODE_ENV = originalEnv;
        return result as PDFParseResult;
      } catch (retryError: any) {
        process.env.NODE_ENV = originalEnv;
        // If still failing, try to require it differently
        throw new Error(`PDF parsing failed: ${retryError.message}`);
      }
    }
    throw error;
  }
}
