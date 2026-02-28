/**
 * Deployment Status Component
 * Shows deployment information to verify frontend is deployed
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { apiClient } from '../utils/api';

interface DeploymentInfo {
  version: string;
  backendVersion: string | null;
  buildTime: string;
  environment: string;
  apiUrl: string;
  apiStatus: 'checking' | 'connected' | 'disconnected';
}

export default function DeploymentStatus() {
  const [info, setInfo] = useState<DeploymentInfo>({
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    backendVersion: null,
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    apiUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'Using proxy (localhost:3001)' : 'Not configured'),
    apiStatus: 'checking',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check API connection status and fetch backend version
    const checkApiStatus = async () => {
      try {
        // Try to ping the health endpoint
        await apiClient.get('/api/health');
        setInfo((prev) => ({ ...prev, apiStatus: 'connected' }));
        
        // Fetch backend version
        try {
          const versionResponse = await apiClient.get('/api/version');
          if (versionResponse.data?.version) {
            setInfo((prev) => ({ ...prev, backendVersion: versionResponse.data.version }));
          }
        } catch (versionError) {
          // Silently fail - backend version is optional
          console.warn('Failed to fetch backend version:', versionError);
        }
      } catch (error: any) {
        // If health check fails, check if it's a network error or just 404
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          setInfo((prev) => ({ ...prev, apiStatus: 'disconnected' }));
        } else {
          // Other errors (like 404) might mean API is reachable but endpoint doesn't exist
          // In that case, assume connected (API URL is set and reachable)
          const apiUrl = import.meta.env.VITE_API_URL;
          if (apiUrl) {
            setInfo((prev) => ({ ...prev, apiStatus: 'connected' }));
          } else {
            // Using proxy - assume connected in dev
            setInfo((prev) => ({ ...prev, apiStatus: 'connected' }));
          }
        }
      }
    };

    checkApiStatus();
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBuildTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (info.apiStatus) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (info.apiStatus) {
      case 'connected':
        return 'API Connected';
      case 'disconnected':
        return 'API Disconnected';
      default:
        return 'Checking...';
    }
  };

  const getEnvironmentBadge = () => {
    const isProduction = info.environment === 'production';
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          isProduction
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}
      >
        {isProduction ? 'PROD' : 'DEV'}
      </span>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg overflow-hidden">
        {/* Collapsed View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-white/80 text-sm font-medium">
              {getStatusText()}
            </span>
            {getEnvironmentBadge()}
          </div>
          <Info className="w-4 h-4 text-white/60" />
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 py-3 border-t border-white/10 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Frontend Version:</span>
              <span className="text-white font-mono">{info.version}</span>
            </div>
            {info.backendVersion && (
              <div className="flex items-center justify-between">
                <span className="text-white/60">Backend Version:</span>
                <span className="text-white font-mono">{info.backendVersion}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-white/60">Build Time:</span>
              <span className="text-white/80 text-xs">
                {formatBuildTime(info.buildTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Environment:</span>
              {getEnvironmentBadge()}
            </div>
            <div className="flex items-start justify-between">
              <span className="text-white/60">API URL:</span>
              <span className="text-white/80 text-xs text-right max-w-[200px] truncate">
                {info.apiUrl}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white/60">Status:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-white/80">{getStatusText()}</span>
              </div>
            </div>
            {info.environment === 'production' && (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center space-x-2 text-green-400 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Frontend Deployed Successfully</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
