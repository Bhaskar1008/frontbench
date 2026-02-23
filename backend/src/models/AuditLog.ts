/**
 * Audit Log Model
 * Tracks all operations for security and compliance
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  sessionId?: string;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'warning';
  ipAddress?: string;
  userAgent?: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  duration?: number; // in milliseconds
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    sessionId: {
      type: String,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'error', 'warning'],
    },
    ipAddress: String,
    userAgent: String,
    requestData: {
      type: Schema.Types.Mixed,
    },
    responseData: {
      type: Schema.Types.Mixed,
    },
    errorMessage: String,
    duration: Number,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

// Indexes for performance and querying
AuditLogSchema.index({ sessionId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
