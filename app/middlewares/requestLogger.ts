import { Request, Response } from "../../type";

/**
 * Middleware untuk logging semua request dan response API
 * Mencatat URL, header/body dari request dan data response dalam satu log
 */
export const requestLogger = async (request: Request, response: Response, next: () => void) => {
  const startTime = Date.now();
  
  // Override response.json untuk capture response data dan log gabungan
  const originalJson = response.json.bind(response);
  response.json = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log gabungan request dan response
    const apiLog = {
      timestamp: new Date().toISOString(),
      request: {
        url: request.url,
        headers: request.headers,
        body: request.body || null
      },
      response: {
        data: typeof data === 'string' && data.length > 1000 
          ? data.substring(0, 1000) + '... (truncated)'
          : data
      },
      duration: `${duration}ms`
    };
    
    console.log('📋 API Log:', JSON.stringify(apiLog, null, 2));
    
    return originalJson(data);
  };
  
  next();
};