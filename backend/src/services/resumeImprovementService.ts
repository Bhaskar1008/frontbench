/**
 * Resume Improvement Service
 * Generates AI-powered suggestions for resume enhancement
 */

import OpenAI from 'openai';
import { calculateTokenCost, getCostPer1KTokens } from '../utils/tokenCost.js';
import { TokenUsage } from '../models/TokenUsage.js';

export interface ResumeSuggestion {
  id: string;
  section: 'summary' | 'experience' | 'skills' | 'education' | 'formatting' | 'achievements';
  sectionLabel: string;
  type: 'job_description' | 'achievements' | 'skill_alignment' | 'formatting' | 'structure' | 'content';
  currentContent?: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface ResumeImprovementResult {
  suggestions: ResumeSuggestion[];
  tokenUsage: { totalTokens: number; promptTokens: number; completionTokens: number; estimatedCost: number };
}

export async function getResumeImprovementSuggestions(
  analysis: any,
  benchmarks: any,
  openai: OpenAI,
  sessionId: string,
  trace?: any
): Promise<ResumeImprovementResult> {
  const generation = trace?.generation({
    name: 'resume-improvement-suggestions',
    model: 'gpt-4o-mini',
    metadata: { sessionId },
  });

  const role = analysis?.currentRole || 'Professional';
  const yearsExp = analysis?.yearsOfExperience ?? 0;
  const marketContext = benchmarks
    ? `Market benchmarks for role: ${benchmarks.role || role}. ${benchmarks.competitivePosition?.percentile ? `Candidate is around ${benchmarks.competitivePosition.percentile} percentile.` : ''}`
    : '';

  const prompt = `You are an expert resume coach. Analyze this resume and provide specific, actionable improvement suggestions.

Resume data (JSON):
${JSON.stringify({
  name: analysis?.name,
  currentRole: analysis?.currentRole,
  currentCompany: analysis?.currentCompany,
  yearsOfExperience: analysis?.yearsOfExperience,
  summary: analysis?.summary,
  experience: analysis?.experience,
  skills: analysis?.skills,
  technologies: analysis?.technologies,
  education: analysis?.education,
  strengths: analysis?.strengths,
  areasForImprovement: analysis?.areasForImprovement,
})}

${marketContext}

Return ONLY a valid JSON object (no markdown) with this structure:
{
  "suggestions": [
    {
      "id": "unique-id-1",
      "section": "summary" | "experience" | "skills" | "education" | "formatting" | "achievements",
      "sectionLabel": "Human-readable section name",
      "type": "job_description" | "achievements" | "skill_alignment" | "formatting" | "structure" | "content",
      "currentContent": "optional excerpt of current content",
      "suggestion": "Specific actionable suggestion text",
      "priority": "high" | "medium" | "low",
      "category": "e.g. Add measurable achievements, Improve job descriptions, Skill alignment, Formatting"
    }
  ]
}

Focus on: (1) Adding measurable achievements with numbers, (2) Improving job descriptions to be impact-focused, (3) Aligning skills with market/role, (4) Formatting and structure. Give 5-12 suggestions.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a resume expert. Return only valid JSON with suggestions array.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '{"suggestions":[]}';
  const parsed = JSON.parse(responseText) as { suggestions: ResumeSuggestion[] };
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  const promptTokens = completion.usage?.prompt_tokens || 0;
  const completionTokens = completion.usage?.completion_tokens || 0;
  const totalTokens = completion.usage?.total_tokens || 0;
  const model = 'gpt-4o-mini';
  const estimatedCost = calculateTokenCost(model, promptTokens, completionTokens);

  if (sessionId) {
    await TokenUsage.create({
      sessionId,
      operation: 'resume-improvement',
      modelName: model,
      promptTokens,
      completionTokens,
      totalTokens,
      costPer1KTokens: getCostPer1KTokens(model),
      estimatedCost,
      metadata: { suggestionCount: suggestions.length },
    });
  }

  return {
    suggestions,
    tokenUsage: {
      totalTokens,
      promptTokens,
      completionTokens,
      estimatedCost,
    },
  };
}
