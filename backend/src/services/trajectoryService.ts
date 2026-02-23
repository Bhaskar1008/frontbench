import OpenAI from 'openai';
import { ResumeAnalysis } from './resumeAnalyzer.js';
import { calculateTokenCost, getCostPer1KTokens } from '../utils/tokenCost.js';
import { TokenUsage } from '../models/TokenUsage.js';

export interface CareerTrajectory {
  currentPosition: {
    role: string;
    level: string;
    estimatedSalary: {
      min: number;
      max: number;
      currency: string;
    };
  };
  nextSteps: {
    role: string;
    timeline: string; // e.g., "6-12 months"
    requirements: string[];
    estimatedSalary: {
      min: number;
      max: number;
      currency: string;
    };
    probability: number; // 0-100
  }[];
  longTermVision: {
    targetRole: string;
    timeline: string; // e.g., "3-5 years"
    path: {
      step: string;
      role: string;
      timeline: string;
      keyMilestones: string[];
    }[];
    estimatedSalary: {
      min: number;
      max: number;
      currency: string;
    };
  };
  growthAreas: {
    area: string;
    importance: 'Low' | 'Medium' | 'High' | 'Critical';
    impact: string;
  }[];
}

export async function generateCareerTrajectory(
  analysis: ResumeAnalysis,
  openai: OpenAI,
  trace?: any,
  sessionId?: string
): Promise<{ trajectory: CareerTrajectory; tokenUsage: any }> {
  const generation = trace?.generation({
    name: 'career-trajectory-generation',
    model: 'gpt-4o-mini',
    metadata: {
      role: analysis.currentRole,
      yearsOfExperience: analysis.yearsOfExperience,
    },
  });

  const prompt = `Based on the following resume analysis, generate a realistic career trajectory showing potential career paths.

Resume Analysis:
- Current Role: ${analysis.currentRole}
- Years of Experience: ${analysis.yearsOfExperience}
- Skills: ${analysis.skills.join(', ')}
- Technologies: ${analysis.technologies.join(', ')}
- Strengths: ${analysis.strengths.join(', ')}
- Areas for Improvement: ${analysis.areasForImprovement.join(', ')}

Generate a realistic career trajectory with next steps and long-term vision for the INDIAN market. Use Indian Rupees (INR) for all salary amounts. Return ONLY valid JSON without markdown formatting.

Return a JSON object with this exact structure:
{
  "currentPosition": {
    "role": "Current job title",
    "level": "Junior/Mid/Senior/Lead/Principal",
    "estimatedSalary": {
      "min": number (in INR, e.g., 500000 for 5 LPA),
      "max": number (in INR, e.g., 1200000 for 12 LPA),
      "currency": "INR"
    }
  },
  "nextSteps": [
    {
      "role": "Next potential role",
      "timeline": "e.g., 6-12 months",
      "requirements": ["requirement1", "requirement2"],
      "estimatedSalary": {
        "min": number (in INR),
        "max": number (in INR),
        "currency": "INR"
      },
      "probability": number (0-100)
    }
  ],
  "longTermVision": {
    "targetRole": "Target role in 3-5 years",
    "timeline": "e.g., 3-5 years",
    "path": [
      {
        "step": "Step description",
        "role": "Role title",
        "timeline": "Timeframe",
        "keyMilestones": ["milestone1", "milestone2"]
      }
    ],
    "estimatedSalary": {
      "min": number (in INR),
      "max": number (in INR),
      "currency": "INR"
    }
  },
  "growthAreas": [
    {
      "area": "Area name",
      "importance": "Low/Medium/High/Critical",
      "impact": "Impact description"
    }
  ]
}`;

  try {
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a career advisor specializing in the Indian job market. Generate realistic career trajectories based on current Indian market trends and the professional\'s background. Use Indian Rupees (INR) for all salary amounts. Typical salary ranges: Junior (3-8 LPA), Mid-level (8-15 LPA), Senior (15-30 LPA), Lead/Principal (30-50+ LPA).',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const latency = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || '{}';
    const trajectory = JSON.parse(responseText) as CareerTrajectory;

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
          operation: 'trajectory',
          modelName: model,
          promptTokens,
          completionTokens,
          totalTokens,
          costPer1KTokens: getCostPer1KTokens(model),
          estimatedCost,
          traceId: trace?.id,
          metadata: {
            targetRole: trajectory.longTermVision?.targetRole,
            nextStepsCount: trajectory.nextSteps?.length || 0,
            latencyMs: latency,
          },
        });
      } catch (error: any) {
        console.error('Failed to save token usage:', error.message);
      }
    }

    generation?.update({
      input: prompt.substring(0, 1000) + '...',
      output: JSON.stringify(trajectory).substring(0, 1000) + '...',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      metadata: {
        latencyMs: latency,
        targetRole: trajectory.longTermVision?.targetRole,
        nextStepsCount: trajectory.nextSteps?.length || 0,
        estimatedCostINR: estimatedCost,
      },
    });
    generation?.end();

    return {
      trajectory,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        model,
      },
    };
  } catch (error: any) {
    console.error('Error generating trajectory:', error);
    throw new Error(`Failed to generate career trajectory: ${error.message}`);
  }
}
