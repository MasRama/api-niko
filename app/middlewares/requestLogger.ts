import { Request, Response } from "../../type";

/**
 * Request Logger Middleware
 * Logs raw request details and response for debugging API calls
 */
export default async (request: Request, response: Response) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log raw request details
    console.log('\n=== API REQUEST LOG ===');
    console.log(`[${timestamp}] ${request.method} ${request.url}`);
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    
    // Log query parameters if any
    if (request.query_parameters && Object.keys(request.query_parameters).length > 0) {
        console.log('Query Parameters:', JSON.stringify(request.query_parameters, null, 2));
    }
    
    // Log URL parameters if any
    if (request.params && Object.keys(request.params).length > 0) {
        console.log('URL Parameters:', JSON.stringify(request.params, null, 2));
    }
    
    // Log request body if exists (for POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
            // For HyperExpress, body is available directly on request object
            if (request.body) {
                console.log('Request Body:', JSON.stringify(request.body, null, 2));
            } else {
                console.log('Request Body: [No body data]');
            }
        } catch (error) {
            console.log('Request Body: [Could not parse body]', error.message);
        }
    }
    
    // Log user info if authenticated
    if (request.user) {
        console.log('Authenticated User:', {
            id: request.user.id,
            email: request.user.email,
            name: request.user.name
        });
    }
    
    // Override response methods to capture response data
    const originalJson = response.json.bind(response);
    const originalSend = response.send.bind(response);
    const originalStatus = response.status.bind(response);
    
    let responseStatus = 200;
    let responseData: any = null;
    
    // Override status method
    response.status = function(code: number) {
        responseStatus = code;
        return originalStatus(code);
    };
    
    // Override json method
    response.json = function(data: any) {
        responseData = data;
        logResponse();
        return originalJson(data);
    };
    
    // Override send method
    response.send = function(data: any) {
        responseData = data;
        logResponse();
        return originalSend(data);
    };
    
    function logResponse() {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n=== API RESPONSE LOG ===');
        console.log(`Status: ${responseStatus}`);
        console.log(`Duration: ${duration}ms`);
        
        if (responseData) {
            // Limit response data logging to avoid huge logs
            const dataToLog = typeof responseData === 'string' 
                ? responseData.substring(0, 1000) + (responseData.length > 1000 ? '...' : '')
                : JSON.stringify(responseData, null, 2).substring(0, 1000) + (JSON.stringify(responseData).length > 1000 ? '...' : '');
            
            console.log('Response Data:', dataToLog);
        }
        
        console.log('=== END REQUEST LOG ===\n');
    }
};