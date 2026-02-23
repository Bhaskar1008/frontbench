import OpenAI from 'openai';
import { Trace } from 'langfuse';
import { calculateTokenCost, getCostPer1KTokens } from '../utils/tokenCost.js';
import { TokenUsage } from '../models/TokenUsage.js';

export interface ResumeAnalysis {
  name: string;
  email: string;
  phone?: string;
  currentRole: string;
  currentCompany?: string;
  yearsOfExperience: number;
  skills: string[];
  technologies: string[];
  education: {
    degree: string;
    institution: string;
    year?: number;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
}

export async function analyzeResume(
  resumeText: string,
  openai: OpenAI,
  trace?: Trace,
  sessionId?: string
): Promise<{ analysis: ResumeAnalysis; tokenUsage: any }> {
  const generation = trace?.generation({
    name: 'resume-analysis',
    model: 'gpt-4o-mini',
    metadata: {
      resumeTextLength: resumeText.length,
    },
  });

  const prompt = `Analyze the following resume and extract structured information. Return ONLY valid JSON without any markdown formatting or code blocks.

Resume Text:
${resumeText.substring(0, 8000)}

Return a JSON object with this exact structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "currentRole": "Current job title",
  "currentCompany": "Current company name or null",
  "yearsOfExperience": number (total years),
  "skills": ["skill1", "skill2", ...],
  "technologies": ["tech1", "tech2", ...],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name",
      "year": graduation year or null
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Duration string (e.g., '2020 - Present')",
      "description": "Brief description"
    }
  ],
  "summary": "Brief professional summary (2-3 sentences)",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"]
}`;

  try {
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert resume analyzer. Extract structured information from resumes and return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const latency = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(responseText) as ResumeAnalysis;

    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;
    const model = 'gpt-4o-mini';
    const estimatedCost = calculateTokenCost(model, promptTokens, completionTokens);

    // Track token usage in database
    if (sessionId) {
      try {
        await TokenUsage.create({
          sessionId,
          operation: 'resume-analysis',
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          costPer1KTokens: getCostPer1KTokens(model),
          estimatedCost,
          traceId: trace?.id,
          metadata: {
            currentRole: analysis.currentRole,
            yearsOfExperience: analysis.yearsOfExperience,
            latencyMs: latency,
          },
        });
      } catch (error: any) {
        console.error('Failed to save token usage:', error.message);
      }
    }

    generation?.update({
      input: prompt.substring(0, 1000) + '...',
      output: JSON.stringify(analysis).substring(0, 1000) + '...',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      metadata: {
        latencyMs: latency,
        currentRole: analysis.currentRole,
        yearsOfExperience: analysis.yearsOfExperience,
        estimatedCostINR: estimatedCost,
      },
    });
    generation?.end();

    // Validate and set defaults
    const validatedAnalysis = {
      name: analysis.name || 'Unknown',
      email: analysis.email || '',
      phone: analysis.phone,
      currentRole: analysis.currentRole || 'Not specified',
      currentCompany: analysis.currentCompany,
      yearsOfExperience: analysis.yearsOfExperience || 0,
      skills: analysis.skills || [],
      technologies: analysis.technologies || [],
      education: analysis.education || [],
      experience: analysis.experience || [],
      summary: analysis.summary || '',
      strengths: analysis.strengths || [],
      areasForImprovement: analysis.areasForImprovement || [],
    };

    return {
      analysis: validatedAnalysis,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        model,
      },
    };
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
}
