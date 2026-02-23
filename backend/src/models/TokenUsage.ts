/**
 * Token Usage Model
 * Tracks token usage and costs per operation
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenUsage {
  sessionId: string;
  operation: 'resume-analysis' | 'benchmarks' | 'trajectory' | 'learning-path';
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costPer1KTokens: number; // Cost per 1K tokens in INR
  estimatedCost: number; // Total cost in INR
  traceId?: string;
  metadata?: {
    role?: string;
    latencyMs?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const TokenUsageSchema = new Schema<ITokenUsage>(
  {
    sessionId: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
      enum: ['resume-analysis', 'benchmarks', 'trajectory', 'learning-path'],
    },
    modelName: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    completionTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    costPer1KTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      required: true,
      default: 0,
    },
    traceId: String,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'token_usage',
  }
);

// Indexes for performance and analytics
TokenUsageSchema.index({ sessionId: 1, createdAt: -1 });
TokenUsageSchema.index({ operation: 1, createdAt: -1 });
TokenUsageSchema.index({ createdAt: -1 });

export const TokenUsage = mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);
