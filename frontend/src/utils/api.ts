/**
 * API Client Configuration
 * Handles API base URL for both development and production
 */

import axios from 'axios';

// Get API base URL from environment variable or use proxy in development
const getApiBaseUrl = (): string => {
  // In production, use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use relative paths (Vite proxy handles it)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

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
