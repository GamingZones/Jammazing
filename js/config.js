// Dynamic API Configuration based on environment

// NOTE: getApiUrl is defined in api.js - use that instead
// This file kept for backward compatibility if needed

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

export const API_BASE_URL = (typeof getApiUrl !== 'undefined' ? getApiUrl() : 'http://localhost:3000') + '/api';
export const SOCKET_URL = getSocketUrl();
