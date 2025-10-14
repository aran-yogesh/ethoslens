// API Configuration
// Centralized configuration for backend API URL

// Construct backend URL from port (single source of truth)
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '4000';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || 'localhost';
const BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

export const API_CONFIG = {
  // Backend API base URL - constructed from VITE_BACKEND_PORT
  BASE_URL: BASE_URL,
  
  // API Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    COPILOTKIT: '/api/copilotkit',
    INTERACTIONS: '/api/interactions',
    GOVERNANCE_STATUS: '/api/governance/status',
    GOVERNANCE_INSIGHTS: '/api/governance/insights',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Convenience exports for common endpoints
export const API_URLS = {
  health: getApiUrl(API_CONFIG.ENDPOINTS.HEALTH),
  copilotkit: getApiUrl(API_CONFIG.ENDPOINTS.COPILOTKIT),
  interactions: getApiUrl(API_CONFIG.ENDPOINTS.INTERACTIONS),
  governanceStatus: getApiUrl(API_CONFIG.ENDPOINTS.GOVERNANCE_STATUS),
  governanceInsights: getApiUrl(API_CONFIG.ENDPOINTS.GOVERNANCE_INSIGHTS),
};
