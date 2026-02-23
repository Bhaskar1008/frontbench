import OpenAI from 'openai';
import { Trace } from 'langfuse';
import { ResumeAnalysis } from './resumeAnalyzer.js';
import { calculateTokenCost, getCostPer1KTokens } from '../utils/tokenCost.js';
import { TokenUsage } from '../models/TokenUsage.js';

export interface BenchmarkData {
  role: string;
  marketData: {
    averageSalary: {
      min: number;
      max: number;
      median: number;
      currency: string;
    };
    experienceLevel: string;
    marketDemand: 'Low' | 'Medium' | 'High' | 'Very High';
    growthRate: number; // percentage
  };
  skillBenchmarks: {
    skill: string;
    yourLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    marketAverage: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    gap: number; // -100 to 100, negative means below average
  }[];
  technologyBenchmarks: {
    technology: string;
    yourLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    marketDemand: 'Low' | 'Medium' | 'High' | 'Very High';
    relevance: number; // 0-100
  }[];
  competitivePosition: {
    percentile: number; // 0-100
    position: 'Below Average' | 'Average' | 'Above Average' | 'Top Performer';
    strengths: string[];
    weaknesses: string[];
  };
}

export async function generateBenchmarks(
  analysis: ResumeAnalysis,
  openai: OpenAI,
  trace?: Trace,
  sessionId?: string
): Promise<{ benchmarks: BenchmarkData; tokenUsage: any }> {
  const generation = trace?.generation({
    name: 'benchmark-generation',
    model: 'gpt-4o-mini',
    metadata: {
      role: analysis.currentRole,
      yearsOfExperience: analysis.yearsOfExperience,
    },
  });

  const prompt = `Based on the following resume analysis, generate comprehensive benchmark data comparing this professional to the current market.

Resume Analysis:
- Role: ${analysis.currentRole}
- Years of Experience: ${analysis.yearsOfExperience}
- Skills: ${analysis.skills.join(', ')}
- Technologies: ${analysis.technologies.join(', ')}
- Summary: ${analysis.summary}

Generate realistic benchmark data for this role and experience level for the INDIAN market. Use Indian Rupees (INR) for all salary amounts. Return ONLY valid JSON without markdown formatting.

Return a JSON object with this exact structure:
{
  "role": "Job title",
  "marketData": {
    "averageSalary": {
      "min": number (in INR, e.g., 500000 for 5 LPA),
      "max": number (in INR, e.g., 1200000 for 12 LPA),
      "median": number (in INR),
      "currency": "INR"
    },
    "experienceLevel": "Junior/Mid/Senior/Lead",
    "marketDemand": "Low/Medium/High/Very High",
    "growthRate": number (percentage, e.g., 15 for 15%)
  },
  "skillBenchmarks": [
    {
      "skill": "skill name",
      "yourLevel": "Beginner/Intermediate/Advanced/Expert",
      "marketAverage": "Beginner/Intermediate/Advanced/Expert",
      "gap": number (-100 to 100, negative means below average)
    }
  ],
  "technologyBenchmarks": [
    {
      "technology": "tech name",
      "yourLevel": "Beginner/Intermediate/Advanced/Expert",
      "marketDemand": "Low/Medium/High/Very High",
      "relevance": number (0-100)
    }
  ],
  "competitivePosition": {
    "percentile": number (0-100),
    "position": "Below Average/Average/Above Average/Top Performer",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  }
}`;

  try {
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a career market analyst specializing in the Indian job market. Generate realistic benchmark data based on current Indian market trends. Use Indian Rupees (INR) for all salary amounts. Typical salary ranges: Junior (3-8 LPA), Mid-level (8-15 LPA), Senior (15-30 LPA), Lead/Principal (30-50+ LPA).',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const latency = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || '{}';
    const benchmarks = JSON.parse(responseText) as BenchmarkData;

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
          operation: 'benchmarks',
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          costPer1KTokens: getCostPer1KTokens(model),
          estimatedCost,
          traceId: trace?.id,
          metadata: {
            role: benchmarks.role,
            percentile: benchmarks.competitivePosition?.percentile,
            latencyMs: latency,
          },
        });
      } catch (error: any) {
        console.error('Failed to save token usage:', error.message);
      }
    }

    generation?.update({
      input: prompt.substring(0, 1000) + '...',
      output: JSON.stringify(benchmarks).substring(0, 1000) + '...',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      metadata: {
        latencyMs: latency,
        role: benchmarks.role,
        percentile: benchmarks.competitivePosition?.percentile,
        estimatedCostINR: estimatedCost,
      },
    });
    generation?.end();

    return {
      benchmarks,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        model,
      },
    };
  } catch (error: any) {
    console.error('Error generating benchmarks:', error);
    throw new Error(`Failed to generate benchmarks: ${error.message}`);
  }
}
