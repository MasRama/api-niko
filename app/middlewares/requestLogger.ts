import { Request, Response } from "../../type";

/**
 * Middleware untuk logging semua request dan response API
 * Mencatat URL, header/body dari request dan data response dalam satu log
 * Termasuk logging untuk 404, 500, dan error responses lainnya
 */
export const requestLogger = async (request: Request, response: Response, next: () => void) => {
  const startTime = Date.now();
  
  // Override response.json untuk capture response data dan log gabungan
  const originalJson = response.json.bind(response);
  const originalStatus = response.status.bind(response);
  
  let statusCode = 200; // Default status code
  
  // Override response.status untuk capture status code
  response.status = function(code: number) {
    statusCode = code;
    return originalStatus(code);
  };
  
  response.json = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Tentukan status code dari response atau dari data jika ada
    const finalStatusCode = statusCode || (data && data.statusCode) || 200;
    
    // Log gabungan request dan response
    const apiLog = {
      timestamp: new Date().toISOString(),
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body || null
      },
      response: {
        statusCode: finalStatusCode,
        data: typeof data === 'string' && data.length > 1000 
          ? data.substring(0, 1000) + '... (truncated)'
          : data
      },
      duration: `${duration}ms`
    };
    
    // Log dengan prefix berbeda untuk error responses
    const logPrefix = finalStatusCode >= 400 ? '❌ API Error Log:' : '📋 API Log:';
    console.log(logPrefix, JSON.stringify(apiLog, null, 2));
    
    return originalJson(data);
  };
  
  next();
};