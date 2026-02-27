/**
 * Document Processor
 * Handles multi-format document parsing and processing
 */

import fs from 'fs/promises';
import path from 'path';
// pdf-parse is lazy-loaded to avoid test file loading issue
// import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ProcessedDocument {
  content: string;
  metadata: {
    filename: string;
    fileType: string;
    pageCount?: number;
    wordCount: number;
    processedAt: Date;
    [key: string]: any;
  };
  chunks?: DocumentChunk[];
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  metadata?: Record<string, any>;
}

export class DocumentProcessor {
  /**
   * Process a document file and extract text content
   */
  async processFile(filePath: string): Promise<ProcessedDocument> {
    const fileExtension = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);

    let content: string;
    let metadata: ProcessedDocument['metadata'] = {
      filename,
      fileType: fileExtension,
      wordCount: 0, // Will be set after processing
      processedAt: new Date(),
    };

    try {
      switch (fileExtension) {
        case '.pdf':
          ({ content, metadata } = await this.processPDF(filePath, metadata));
          break;
        case '.docx':
          ({ content, metadata } = await this.processDOCX(filePath, metadata));
          break;
        case '.txt':
          ({ content, metadata } = await this.processTXT(filePath, metadata));
          break;
        case '.json':
          ({ content, metadata } = await this.processJSON(filePath, metadata));
          break;
        case '.html':
        case '.htm':
          ({ content, metadata } = await this.processHTML(filePath, metadata));
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      const wordCount = this.countWords(content);
      metadata.wordCount = wordCount;

      return {
        content,
        metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Process PDF file
   */
  private async processPDF(
    filePath: string,
    metadata: ProcessedDocument['metadata']
  ): Promise<{ content: string; metadata: ProcessedDocument['metadata'] }> {
    const buffer = await fs.readFile(filePath);
    // Use wrapper function to handle pdf-parse module issues
    const { parsePDF } = await import('../utils/pdfParser.js');
    const pdfData = await parsePDF(buffer);

    return {
      content: pdfData.text,
      metadata: {
        ...metadata,
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
      },
    };
  }

  /**
   * Process DOCX file
   */
  private async processDOCX(
    filePath: string,
    metadata: ProcessedDocument['metadata']
  ): Promise<{ content: string; metadata: ProcessedDocument['metadata'] }> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return {
      content: result.value,
      metadata: {
        ...metadata,
        warnings: result.messages.length > 0 ? result.messages : undefined,
      },
    };
  }

  /**
   * Process TXT file
   */
  private async processTXT(
    filePath: string,
    metadata: ProcessedDocument['metadata']
  ): Promise<{ content: string; metadata: ProcessedDocument['metadata'] }> {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, metadata };
  }

  /**
   * Process JSON file
   */
  private async processJSON(
    filePath: string,
    metadata: ProcessedDocument['metadata']
  ): Promise<{ content: string; metadata: ProcessedDocument['metadata'] }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(content);
    
    // Convert JSON to readable text
    const textContent = JSON.stringify(jsonData, null, 2);

    return {
      content: textContent,
      metadata: {
        ...metadata,
        jsonKeys: Object.keys(jsonData),
      },
    };
  }

  /**
   * Process HTML file
   */
  private async processHTML(
    filePath: string,
    metadata: ProcessedDocument['metadata']
  ): Promise<{ content: string; metadata: ProcessedDocument['metadata'] }> {
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    
    // Simple HTML to text conversion (remove tags)
    // For production, consider using a library like cheerio or jsdom
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      content: textContent,
      metadata: {
        ...metadata,
        hasScripts: htmlContent.includes('<script'),
        hasStyles: htmlContent.includes('<style'),
      },
    };
  }

  /**
   * Chunk document content using semantic chunking
   */
  chunkDocument(
    document: ProcessedDocument,
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const content = document.content;
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      const chunkContent = content.substring(startIndex, endIndex);

      chunks.push({
        content: chunkContent,
        chunkIndex,
        startChar: startIndex,
        endChar: endIndex,
        metadata: {
          ...document.metadata,
          chunkSize: chunkContent.length,
        },
      });

      startIndex = endIndex - chunkOverlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }
}
