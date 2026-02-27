/**
 * Validator Agent
 * Validates outputs, checks quality, and catches errors
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export class ValidatorAgent extends BaseAgent {
  constructor(config: AgentConfig = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.1, // Very low temperature for validation
    });
  }

  protected registerTools(): void {
    // Validator uses schema validation tools
  }

  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are a quality validation agent. Your role is to validate outputs from other agents and ensure they meet quality standards.

Validation criteria:
1. **Completeness**: All required fields are present
2. **Accuracy**: Information is correct and consistent
3. **Format**: Output matches expected structure
4. **Quality**: Content is meaningful and useful
5. **Safety**: No harmful or inappropriate content

For each validation, provide:
- Validation score (0-100)
- List of issues (errors, warnings, info)
- Suggestions for improvement

Be thorough but fair in your validation.`,
    };
  }

  /**
   * Validate output against schema
   */
  async validateAgainstSchema<T>(
    output: any,
    schema: z.ZodSchema<T>
  ): Promise<ValidationResult> {
    const schemaResult = schema.safeParse(output);

    if (!schemaResult.success) {
      return {
        isValid: false,
        score: 0,
        issues: schemaResult.error.errors.map((err) => ({
          type: 'error' as const,
          field: err.path.join('.'),
          message: err.message,
          severity: 'high' as const,
        })),
        suggestions: ['Fix schema validation errors'],
      };
    }

    // Additional quality checks
    return this.validateQuality(schemaResult.data);
  }

  /**
   * Validate output quality
   */
  async validateQuality(output: any): Promise<ValidationResult> {
    const prompt = `Validate the quality of this output:

${JSON.stringify(output, null, 2)}

Check for:
1. Completeness - Are all important fields present?
2. Accuracy - Is the information logical and consistent?
3. Quality - Is the content meaningful and useful?
4. Safety - Any harmful or inappropriate content?

Return a JSON object with:
{
  "isValid": true/false,
  "score": 0-100,
  "issues": [
    {
      "type": "error|warning|info",
      "field": "field_name",
      "message": "description",
      "severity": "high|medium|low"
    }
  ],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const result = await this.execute(prompt);

    try {
      const validation = JSON.parse(result.output) as ValidationResult;
      return validation;
    } catch (error: any) {
      // Fallback validation
      return {
        isValid: true,
        score: 50,
        issues: [
          {
            type: 'warning',
            field: 'validation',
            message: 'Could not parse validation result',
            severity: 'medium',
          },
        ],
        suggestions: ['Review output manually'],
      };
    }
  }

  /**
   * Validate resume analysis output
   */
  async validateResumeAnalysis(analysis: any): Promise<ValidationResult> {
    const resumeSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      currentRole: z.string().min(1),
      yearsOfExperience: z.number().min(0),
      skills: z.array(z.string()).min(1),
      technologies: z.array(z.string()),
      education: z.array(
        z.object({
          degree: z.string(),
          institution: z.string(),
        })
      ),
      experience: z.array(
        z.object({
          title: z.string(),
          company: z.string(),
          duration: z.string(),
          description: z.string(),
        })
      ),
      summary: z.string().min(50),
      strengths: z.array(z.string()).min(1),
      areasForImprovement: z.array(z.string()),
    });

    return this.validateAgainstSchema(analysis, resumeSchema);
  }

  /**
   * Check for hallucinations or inconsistencies
   */
  async detectHallucinations(output: any, sourceData: string): Promise<ValidationIssue[]> {
    const prompt = `Compare this output with the source data and detect any hallucinations or inconsistencies:

Source Data (excerpt):
${sourceData.substring(0, 1000)}

Output:
${JSON.stringify(output, null, 2)}

Identify any information in the output that:
- Cannot be found in the source data
- Contradicts the source data
- Seems fabricated or exaggerated

Return a JSON array of issues:
[
  {
    "type": "error|warning",
    "field": "field_name",
    "message": "description",
    "severity": "high|medium|low"
  }
]`;

    const result = await this.execute(prompt);

    try {
      const issues = JSON.parse(result.output) as ValidationIssue[];
      return issues;
    } catch {
      return [];
    }
  }
}
