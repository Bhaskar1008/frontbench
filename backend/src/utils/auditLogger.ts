/**
 * Audit Logger
 * Centralized logging for all operations
 */

import { AuditLog } from '../models/AuditLog.js';

export interface AuditLogData {
  sessionId?: string;
  action: string;
  resource: string;
  status: 'success' | 'error' | 'warning';
  ipAddress?: string;
  userAgent?: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  duration?: number;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Log an audit event
 * Non-blocking - doesn't throw errors
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await AuditLog.create({
      ...data,
      createdAt: new Date(),
    });
  } catch (error: any) {
    // Don't throw - audit logging shouldn't break the application
    console.error('Failed to log audit event:', error.message);
  }
}

/**
 * Extract IP address from request
 */
export function getIpAddress(req: any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}
