/**
 * API Client Configuration
 * Handles API base URL for both development and production
 */

import axios from 'axios';

// Get API base URL from environment variable or use proxy in development
const getApiBaseUrl = (): string => {
  // In production (Netlify), use the environment variable VITE_API_URL
  // This will be set in Netlify environment variables
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Remove trailing slash if present
    return apiUrl.replace(/\/$/, '');
  }
  
  // In development, use empty string (Vite proxy handles it)
  // The vite.config.ts proxy will forward /api/* to http://localhost:3001
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Log API URL in development for debugging (not in production)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL || 'Using Vite proxy (localhost:3001)');
}

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For file uploads
export const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export default apiClient;
