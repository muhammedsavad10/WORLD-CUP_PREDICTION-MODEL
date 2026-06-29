export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://world-cup-prediction-model-5.onrender.com' 
    : 'http://localhost:8000');

// Environment validation and warnings
if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[API Configuration Warning]: VITE_API_URL environment variable is missing. ' +
    'Falling back to default development server: http://localhost:8000. ' +
    'To override, create a .env.local file with VITE_API_URL=...'
  );
}

// Derive WS_BASE_URL dynamically based on API_BASE_URL
const getWsBaseUrl = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/$/, '');
  if (normalized.startsWith('https://')) {
    return `wss://${normalized.replace('https://', '')}`;
  } else if (normalized.startsWith('http://')) {
    return `ws://${normalized.replace('http://', '')}`;
  } else {
    // Relative fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
};

export const WS_BASE_URL = getWsBaseUrl(API_BASE_URL);

/**
 * Generates a full WebSocket URL for a given path using the derived WS_BASE_URL.
 */
export const getWebSocketUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${WS_BASE_URL}${cleanPath}`;
};

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Standardized fetch wrapper with automatic timeouts, unmount cancellation support,
 * and unified error parsing.
 */
export const apiFetch = async (path: string, options: ApiFetchOptions = {}): Promise<Response> => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;
  
  const { timeoutMs = 30000, signal, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Link outer signal (e.g. from React Query unmounting) to our AbortController
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorDetail = '';
      try {
        const errJson = await response.json();
        errorDetail = errJson.message || errJson.detail || JSON.stringify(errJson);
      } catch {
        errorDetail = response.statusText || `HTTP Status ${response.status}`;
      }
      
      const errorMsg = `API Request failed with status ${response.status}: ${errorDetail}`;
      if (import.meta.env.DEV) {
        console.error(`[apiFetch Error] ${url}:`, errorMsg);
      }
      throw new Error(errorMsg);
    }
    
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    let errorMsg = err.message;
    if (err.name === 'AbortError') {
      errorMsg = `API Request timed out after ${timeoutMs / 1000}s`;
    }
    
    if (import.meta.env.DEV) {
      console.error(`[apiFetch Connection Error] ${url}:`, err);
    }
    throw err instanceof Error ? err : new Error(errorMsg);
  }
};
