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
 * Parse PDF buffer using pdf-parse-debugging-disabled
 * This package is a fork of pdf-parse with debug mode disabled
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // Use pdf-parse-debugging-disabled which doesn't have the test file issue
  // @ts-ignore - pdf-parse-debugging-disabled has same API as pdf-parse
  const pdfParseModule = await import('pdf-parse-debugging-disabled');
  const pdfParse = pdfParseModule.default || pdfParseModule;
  
  const result = await pdfParse(buffer);
  return result as PDFParseResult;
}
