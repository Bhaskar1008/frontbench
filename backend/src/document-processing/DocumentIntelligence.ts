/**
 * Document Intelligence Platform
 * Advanced document understanding and extraction
 */

import { DocumentProcessor, ProcessedDocument, DocumentChunk } from './DocumentProcessor.js';
import { ChatOpenAI } from '@langchain/openai';

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
  entities: Entity[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

export interface Entity {
  type: 'person' | 'organization' | 'location' | 'skill' | 'technology' | 'date' | 'other';
  value: string;
  confidence: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  metadata?: Record<string, any>;
}

export class DocumentIntelligence {
  private processor: DocumentProcessor;
  private llm: ChatOpenAI;

  constructor() {
    this.processor = new DocumentProcessor();
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3,
    });
  }

  /**
   * Generate multi-level summary
   */
  async generateSummary(
    document: ProcessedDocument,
    level: 'brief' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<DocumentSummary> {
    const lengthMap = {
      brief: 100,
      detailed: 300,
      comprehensive: 500,
    };

    const prompt = `Analyze this document and provide:
1. A ${level} summary (${lengthMap[level]} words)
2. Key points (5-10 bullet points)
3. Important entities (people, organizations, skills, technologies, dates)
4. Overall sentiment (positive/neutral/negative)
5. Confidence score (0-1)

Document:
${document.content.substring(0, 8000)}

Return JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "entities": [
    {"type": "person|organization|location|skill|technology|date|other", "value": "...", "confidence": 0.9}
  ],
  "sentiment": "positive|neutral|negative",
  "confidence": 0.95
}`;

    const result = await this.llm.invoke(prompt);

    try {
      const summary = JSON.parse(result.content as string) as DocumentSummary;
      return summary;
    } catch (error: any) {
      // Fallback summary
      return {
        summary: document.content.substring(0, lengthMap[level]),
        keyPoints: [],
        entities: [],
        confidence: 0.5,
      };
    }
  }

  /**
   * Extract entities from document
   */
  async extractEntities(document: ProcessedDocument): Promise<Entity[]> {
    const prompt = `Extract all important entities from this document:

${document.content.substring(0, 8000)}

Identify:
- People (names)
- Organizations (companies, institutions)
- Locations (cities, countries)
- Skills (technical and soft skills)
- Technologies (tools, frameworks, languages)
- Dates (important dates, years)

Return JSON array:
[
  {"type": "person", "value": "John Doe", "confidence": 0.95},
  {"type": "organization", "value": "Microsoft", "confidence": 0.9},
  ...
]`;

    const result = await this.llm.invoke(prompt);

    try {
      const entities = JSON.parse(result.content as string) as Entity[];
      return entities;
    } catch {
      return [];
    }
  }

  /**
   * Extract tables from document (basic implementation)
   */
  async extractTables(document: ProcessedDocument): Promise<TableData[]> {
    // This is a simplified implementation
    // In production, use specialized libraries like tabula-py for PDFs
    const tables: TableData[] = [];

    // Look for table-like structures in text
    const lines = document.content.split('\n');
    let currentTable: string[][] = [];

    for (const line of lines) {
      // Simple heuristic: lines with multiple separators might be tables
      const cells = line.split(/\s{2,}|\t/).filter((cell) => cell.trim().length > 0);
      if (cells.length >= 2) {
        currentTable.push(cells);
      } else if (currentTable.length > 0) {
        // End of table
        if (currentTable.length > 1) {
          tables.push({
            headers: currentTable[0],
            rows: currentTable.slice(1),
          });
        }
        currentTable = [];
      }
    }

    return tables;
  }

  /**
   * Compare two documents
   */
  async compareDocuments(
    doc1: ProcessedDocument,
    doc2: ProcessedDocument
  ): Promise<{
    similarities: string[];
    differences: string[];
    similarityScore: number;
  }> {
    const prompt = `Compare these two documents and identify:

1. Similarities (what they have in common)
2. Differences (what's unique to each)
3. Overall similarity score (0-1)

Document 1:
${doc1.content.substring(0, 4000)}

Document 2:
${doc2.content.substring(0, 4000)}

Return JSON:
{
  "similarities": ["...", "..."],
  "differences": ["...", "..."],
  "similarityScore": 0.75
}`;

    const result = await this.llm.invoke(prompt);

    try {
      return JSON.parse(result.content as string);
    } catch {
      return {
        similarities: [],
        differences: [],
        similarityScore: 0,
      };
    }
  }

  /**
   * Detect inconsistencies in document
   */
  async detectInconsistencies(document: ProcessedDocument): Promise<{
    issues: Array<{
      type: 'contradiction' | 'missing_info' | 'format_error' | 'other';
      description: string;
      severity: 'high' | 'medium' | 'low';
      location?: string;
    }>;
  }> {
    const prompt = `Analyze this document for inconsistencies:

${document.content.substring(0, 8000)}

Look for:
- Contradictory information
- Missing required information
- Format errors
- Logical inconsistencies

Return JSON:
{
  "issues": [
    {
      "type": "contradiction|missing_info|format_error|other",
      "description": "...",
      "severity": "high|medium|low",
      "location": "section/page reference"
    }
  ]
}`;

    const result = await this.llm.invoke(prompt);

    try {
      return JSON.parse(result.content as string);
    } catch {
      return { issues: [] };
    }
  }
}
