// Dynamic API Configuration based on environment

// Determine API URL based on environment
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return 'http://localhost:3000';
    }
    
    // Production - use Netlify environment variable or infer from origin
    const apiUrl = window.__API_URL__ || process.env.REACT_APP_API_URL;
    if (apiUrl) return apiUrl;
    
    // Fallback: same origin with /api
    return `${window.location.origin}`;
  }
  
  // Node environment fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return 'http://localhost:3000';
    }
    
    const socketUrl = window.__SOCKET_URL__ || process.env.REACT_APP_SOCKET_URL;
    if (socketUrl) return socketUrl;
    
    return `${window.location.origin}`;
  }
  
  return process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
};

export const API_BASE_URL = getApiUrl() + '/api';
export const SOCKET_URL = getSocketUrl();
