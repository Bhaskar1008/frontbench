import OpenAI from 'openai';
import { Trace } from 'langfuse';
import { ResumeAnalysis } from './resumeAnalyzer.js';
import { CareerTrajectory } from './trajectoryService.js';
import { calculateTokenCost, getCostPer1KTokens } from '../utils/tokenCost.js';
import { TokenUsage } from '../models/TokenUsage.js';

export interface LearningPath {
  overview: string;
  phases: {
    phase: number;
    name: string;
    duration: string;
    description: string;
    goals: string[];
    resources: {
      type: 'Course' | 'Book' | 'Project' | 'Certification' | 'Practice' | 'Community';
      title: string;
      description: string;
      url?: string;
      priority: 'Low' | 'Medium' | 'High' | 'Critical';
    }[];
    milestones: string[];
  }[];
  focusAreas: {
    area: string;
    currentLevel: string;
    targetLevel: string;
    learningResources: string[];
    estimatedTime: string;
  }[];
  quickWins: {
    title: string;
    description: string;
    timeToComplete: string;
    impact: string;
  }[];
  longTermGoals: {
    goal: string;
    timeline: string;
    steps: string[];
  }[];
}

export async function generateLearningPath(
  analysis: ResumeAnalysis,
  trajectory: CareerTrajectory | undefined,
  openai: OpenAI,
  trace?: Trace,
  sessionId?: string
): Promise<{ learningPath: LearningPath; tokenUsage: any }> {
  const generation = trace?.generation({
    name: 'learning-path-generation',
    model: 'gpt-4o-mini',
    metadata: {
      role: analysis.currentRole,
      hasTrajectory: !!trajectory,
      targetRole: trajectory?.longTermVision?.targetRole,
    },
  });

  const trajectoryInfo = trajectory
    ? `Career Trajectory:
- Next Steps: ${trajectory.nextSteps.map((s) => s.role).join(', ')}
- Target Role: ${trajectory.longTermVision.targetRole}
- Growth Areas: ${trajectory.growthAreas.map((g) => g.area).join(', ')}`
    : 'No trajectory data available';

  const prompt = `Based on the following resume analysis and career trajectory, generate a comprehensive learning path.

Resume Analysis:
- Current Role: ${analysis.currentRole}
- Years of Experience: ${analysis.yearsOfExperience}
- Skills: ${analysis.skills.join(', ')}
- Technologies: ${analysis.technologies.join(', ')}
- Strengths: ${analysis.strengths.join(', ')}
- Areas for Improvement: ${analysis.areasForImprovement.join(', ')}

${trajectoryInfo}

Generate a detailed, actionable learning path with phases, resources, and milestones. Return ONLY valid JSON without markdown formatting.

Return a JSON object with this exact structure:
{
  "overview": "Brief overview of the learning path (2-3 sentences)",
  "phases": [
    {
      "phase": number,
      "name": "Phase name",
      "duration": "e.g., 2-3 months",
      "description": "Phase description",
      "goals": ["goal1", "goal2"],
      "resources": [
        {
          "type": "Course/Book/Project/Certification/Practice/Community",
          "title": "Resource title",
          "description": "Resource description",
          "url": "optional URL",
          "priority": "Low/Medium/High/Critical"
        }
      ],
      "milestones": ["milestone1", "milestone2"]
    }
  ],
  "focusAreas": [
    {
      "area": "Area name",
      "currentLevel": "Current level",
      "targetLevel": "Target level",
      "learningResources": ["resource1", "resource2"],
      "estimatedTime": "Time estimate"
    }
  ],
  "quickWins": [
    {
      "title": "Quick win title",
      "description": "Description",
      "timeToComplete": "e.g., 1-2 weeks",
      "impact": "Impact description"
    }
  ],
  "longTermGoals": [
    {
      "goal": "Long-term goal",
      "timeline": "Timeline",
      "steps": ["step1", "step2"]
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
            'You are a learning and development expert. Generate practical, actionable learning paths with real resources and realistic timelines.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const latency = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || '{}';
    const learningPath = JSON.parse(responseText) as LearningPath;

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
          operation: 'learning-path',
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          costPer1KTokens: getCostPer1KTokens(model),
          estimatedCost,
          traceId: trace?.id,
          metadata: {
            phasesCount: learningPath.phases?.length || 0,
            quickWinsCount: learningPath.quickWins?.length || 0,
            latencyMs: latency,
          },
        });
      } catch (error: any) {
        console.error('Failed to save token usage:', error.message);
      }
    }

    generation?.update({
      input: prompt.substring(0, 1000) + '...',
      output: JSON.stringify(learningPath).substring(0, 1000) + '...',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
      metadata: {
        latencyMs: latency,
        phasesCount: learningPath.phases?.length || 0,
        quickWinsCount: learningPath.quickWins?.length || 0,
        estimatedCostINR: estimatedCost,
      },
    });
    generation?.end();

    return {
      learningPath,
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        model,
      },
    };
  } catch (error: any) {
    console.error('Error generating learning path:', error);
    throw new Error(`Failed to generate learning path: ${error.message}`);
  }
}
