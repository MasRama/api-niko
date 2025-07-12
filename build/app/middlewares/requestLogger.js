"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (request, response) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log('\n=== API REQUEST LOG ===');
    console.log(`[${timestamp}] ${request.method} ${request.url}`);
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    if (request.query_parameters && Object.keys(request.query_parameters).length > 0) {
        console.log('Query Parameters:', JSON.stringify(request.query_parameters, null, 2));
    }
    if (request.params && Object.keys(request.params).length > 0) {
        console.log('URL Parameters:', JSON.stringify(request.params, null, 2));
    }
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
            if (request.body) {
                console.log('Request Body:', JSON.stringify(request.body, null, 2));
            }
            else {
                console.log('Request Body: [No body data]');
            }
        }
        catch (error) {
            console.log('Request Body: [Could not parse body]', error.message);
        }
    }
    if (request.user) {
        console.log('Authenticated User:', {
            id: request.user.id,
            email: request.user.email,
            name: request.user.name
        });
    }
    const originalJson = response.json.bind(response);
    const originalSend = response.send.bind(response);
    const originalStatus = response.status.bind(response);
    let responseStatus = 200;
    let responseData = null;
    response.status = function (code) {
        responseStatus = code;
        return originalStatus(code);
    };
    response.json = function (data) {
        responseData = data;
        logResponse();
        return originalJson(data);
    };
    response.send = function (data) {
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
            const dataToLog = typeof responseData === 'string'
                ? responseData.substring(0, 1000) + (responseData.length > 1000 ? '...' : '')
                : JSON.stringify(responseData, null, 2).substring(0, 1000) + (JSON.stringify(responseData).length > 1000 ? '...' : '');
            console.log('Response Data:', dataToLog);
        }
        console.log('=== END REQUEST LOG ===\n');
    }
};
//# sourceMappingURL=requestLogger.js.map