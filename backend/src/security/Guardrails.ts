/**
 * Security Guardrails
 * Protects against prompt injection, validates outputs, and ensures safety
 */

import { z } from 'zod';

export interface GuardrailConfig {
  enablePromptInjectionDetection?: boolean;
  enableOutputValidation?: boolean;
  enablePIIDetection?: boolean;
  maxInputLength?: number;
}

export class Guardrails {
  private config: Required<GuardrailConfig>;

  // Common prompt injection patterns
  private readonly INJECTION_PATTERNS = [
    /ignore\s+(previous|all)\s+(instructions|rules)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /system\s*:\s*/i,
    /<\|(system|user|assistant)\|>/i,
    /\[INST\]/i,
    /###\s*(system|instruction)/i,
    /override\s+(system|instructions)/i,
    /forget\s+(everything|all|previous)/i,
  ];

  // PII patterns
  private readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  };

  constructor(config: GuardrailConfig = {}) {
    this.config = {
      enablePromptInjectionDetection: config.enablePromptInjectionDetection ?? true,
      enableOutputValidation: config.enableOutputValidation ?? true,
      enablePIIDetection: config.enablePIIDetection ?? true,
      maxInputLength: config.maxInputLength ?? 50000,
    };
  }

  /**
   * Validate and sanitize input
   */
  validateInput(input: string): {
    isValid: boolean;
    sanitized: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let sanitized = input;

    // Length check
    if (input.length > this.config.maxInputLength) {
      warnings.push(`Input exceeds maximum length of ${this.config.maxInputLength} characters`);
      sanitized = input.substring(0, this.config.maxInputLength);
    }

    // Prompt injection detection
    if (this.config.enablePromptInjectionDetection) {
      const injectionDetected = this.detectPromptInjection(input);
      if (injectionDetected) {
        warnings.push('Potential prompt injection detected');
        // Remove suspicious patterns
        sanitized = this.sanitizeInjectionPatterns(sanitized);
      }
    }

    // PII detection
    if (this.config.enablePIIDetection) {
      const piiDetected = this.detectPII(input);
      if (piiDetected.length > 0) {
        warnings.push(`PII detected: ${piiDetected.join(', ')}`);
        sanitized = this.maskPII(sanitized);
      }
    }

    return {
      isValid: warnings.length === 0,
      sanitized,
      warnings,
    };
  }

  /**
   * Detect prompt injection attempts
   */
  detectPromptInjection(input: string): boolean {
    return this.INJECTION_PATTERNS.some((pattern) => pattern.test(input));
  }

  /**
   * Sanitize injection patterns
   */
  private sanitizeInjectionPatterns(input: string): string {
    let sanitized = input;
    this.INJECTION_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized.trim();
  }

  /**
   * Detect PII in text
   */
  detectPII(text: string): string[] {
    const detected: string[] = [];

    if (this.PII_PATTERNS.email.test(text)) detected.push('email');
    if (this.PII_PATTERNS.phone.test(text)) detected.push('phone');
    if (this.PII_PATTERNS.ssn.test(text)) detected.push('ssn');
    if (this.PII_PATTERNS.creditCard.test(text)) detected.push('credit_card');

    return detected;
  }

  /**
   * Mask PII in text
   */
  maskPII(text: string): string {
    let masked = text;

    masked = masked.replace(this.PII_PATTERNS.email, (match) => {
      const [local, domain] = match.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    });

    masked = masked.replace(this.PII_PATTERNS.phone, '***-***-****');
    masked = masked.replace(this.PII_PATTERNS.ssn, '***-**-****');
    masked = masked.replace(this.PII_PATTERNS.creditCard, '****-****-****-****');

    return masked;
  }

  /**
   * Validate output structure
   */
  validateOutput<T>(output: string, schema: z.ZodSchema<T>): {
    isValid: boolean;
    parsed?: T;
    error?: string;
  } {
    if (!this.config.enableOutputValidation) {
      return { isValid: true };
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(output);
      } catch {
        return {
          isValid: false,
          error: 'Output is not valid JSON',
        };
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        return {
          isValid: false,
          error: `Output validation failed: ${result.error.message}`,
        };
      }

      return {
        isValid: true,
        parsed: result.data,
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for toxicity or harmful content
   */
  async checkToxicity(text: string): Promise<{
    isToxic: boolean;
    score?: number;
    categories?: string[];
  }> {
    // Basic toxicity patterns
    const toxicPatterns = [
      /hate|discrimination|violence|threat/i,
      /offensive|abusive|harassment/i,
    ];

    const matches = toxicPatterns.filter((pattern) => pattern.test(text));

    if (matches.length > 0) {
      return {
        isToxic: true,
        score: matches.length / toxicPatterns.length,
        categories: ['general'],
      };
    }

    return {
      isToxic: false,
      score: 0,
    };
  }

  /**
   * Validate agent output structure
   */
  async validateAgentOutput(
    output: any,
    expectedSchema: Record<string, any>
  ): Promise<{
    isValid: boolean;
    score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      field: string;
      message: string;
      severity: 'high' | 'medium' | 'low';
    }>;
    suggestions: string[];
  }> {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      field: string;
      message: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Check required fields
    for (const [field, type] of Object.entries(expectedSchema)) {
      if (!(field in output)) {
        issues.push({
          type: 'error',
          field,
          message: `Missing required field: ${field}`,
          severity: 'high',
        });
      } else if (typeof output[field] !== type) {
        issues.push({
          type: 'warning',
          field,
          message: `Type mismatch: expected ${type}, got ${typeof output[field]}`,
          severity: 'medium',
        });
      }
    }

    return {
      isValid: issues.filter((i) => i.type === 'error').length === 0,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 10),
      issues,
      suggestions: issues.length > 0 ? ['Fix validation errors'] : [],
    };
  }

  /**
   * Sanitize output before returning to user
   */
  sanitizeOutput(output: any): any {
    if (typeof output === 'string') {
      return this.maskPII(output);
    }

    if (Array.isArray(output)) {
      return output.map((item) => this.sanitizeOutput(item));
    }

    if (typeof output === 'object' && output !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(output)) {
        sanitized[key] = this.sanitizeOutput(value);
      }
      return sanitized;
    }

    return output;
  }
}
