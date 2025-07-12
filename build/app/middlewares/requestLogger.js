"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = async (request, response, next) => {
    const startTime = Date.now();
    const originalJson = response.json.bind(response);
    response.json = function (data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
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
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map