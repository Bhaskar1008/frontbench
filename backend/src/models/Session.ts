/**
 * Session Model
 * Stores resume analysis sessions with all related data
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: Date;
  extractedText: string;
  analysis?: any;
  benchmarks?: any;
  trajectory?: any;
  learningPath?: any;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number; // in INR
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    name?: string;
    email?: string;
    conversationHistory?: Array<{
      input: string;
      output: string;
      timestamp: Date;
    }>;
    preferences?: Record<string, any>;
    userPreferences?: Record<string, any>;
    preferencesUpdatedAt?: Date;
    projectId?: string;
    userId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    fileName: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    extractedText: {
      type: String,
      required: true,
    },
    analysis: {
      type: Schema.Types.Mixed,
    },
    benchmarks: {
      type: Schema.Types.Mixed,
    },
    trajectory: {
      type: Schema.Types.Mixed,
    },
    learningPath: {
      type: Schema.Types.Mixed,
    },
    tokenUsage: {
      totalTokens: { type: Number, default: 0 },
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      estimatedCost: { type: Number, default: 0 }, // in INR
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      name: String,
      email: String,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// Indexes for performance
SessionSchema.index({ sessionId: 1 });
SessionSchema.index({ uploadedAt: -1 });
SessionSchema.index({ 'metadata.email': 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
