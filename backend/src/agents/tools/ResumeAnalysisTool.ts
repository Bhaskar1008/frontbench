/**
 * Resume Analysis Tool
 * Analyzes resumes and extracts structured information
 */

import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { analyzeResume, ResumeAnalysis } from '../../services/resumeAnalyzer.js';

export interface ResumeAnalysisToolConfig {
  openai: ChatOpenAI;
}

export class ResumeAnalysisTool extends Tool {
  name = 'resume_analysis';
  description = `Analyzes a resume and extracts structured information including:
  - Personal details (name, email, phone)
  - Current role and company
  - Years of experience
  - Skills and technologies
  - Education history
  - Work experience
  - Strengths and areas for improvement
  Input should be the resume text content.`;

  private openai: ChatOpenAI;

  constructor(config: ResumeAnalysisToolConfig) {
    const schema = z.object({
      resumeText: z.string().describe('The full text content of the resume to analyze'),
    });

    super({
      name: 'resume_analysis',
      description: `Analyzes a resume and extracts structured information including:
      - Personal details (name, email, phone)
      - Current role and company
      - Years of experience
      - Skills and technologies
      - Education history
      - Work experience
      - Strengths and areas for improvement
      Input should be the resume text content.`,
      schema,
    } as any);

    this.openai = config.openai;
  }

  async _call(input: string): Promise<string> {
    try {
      // Convert LangChain OpenAI client to OpenAI SDK client
      const openaiSdk = new (await import('openai')).default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const result = await analyzeResume(
        input,
        openaiSdk,
        undefined, // trace
        undefined // sessionId
      );

      return this.formatAnalysis(result.analysis);
    } catch (error: any) {
      return `Error analyzing resume: ${error.message}`;
    }
  }

  private formatAnalysis(analysis: ResumeAnalysis): string {
    return `
RESUME ANALYSIS RESULTS:

Personal Information:
- Name: ${analysis.name}
- Email: ${analysis.email}
${analysis.phone ? `- Phone: ${analysis.phone}` : ''}

Current Position:
- Role: ${analysis.currentRole}
${analysis.currentCompany ? `- Company: ${analysis.currentCompany}` : ''}
- Years of Experience: ${analysis.yearsOfExperience}

Skills:
${analysis.skills.map((skill) => `- ${skill}`).join('\n')}

Technologies:
${analysis.technologies.map((tech) => `- ${tech}`).join('\n')}

Education:
${analysis.education.map((edu) => `- ${edu.degree} from ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`).join('\n')}

Work Experience:
${analysis.experience.map((exp) => `- ${exp.title} at ${exp.company} (${exp.duration})\n  ${exp.description}`).join('\n\n')}

Summary:
${analysis.summary}

Strengths:
${analysis.strengths.map((s) => `- ${s}`).join('\n')}

Areas for Improvement:
${analysis.areasForImprovement.map((a) => `- ${a}`).join('\n')}
`;
  }
}
