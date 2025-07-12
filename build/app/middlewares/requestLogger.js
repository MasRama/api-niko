"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = async (request, response, next) => {
    const startTime = Date.now();
    const originalJson = response.json.bind(response);
    const originalStatus = response.status.bind(response);
    let statusCode = 200;
    response.status = function (code) {
        statusCode = code;
        return originalStatus(code);
    };
    response.json = function (data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const finalStatusCode = statusCode || (data && data.statusCode) || 200;
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
        const logPrefix = finalStatusCode >= 400 ? '❌ API Error Log:' : '📋 API Log:';
        console.log(logPrefix, JSON.stringify(apiLog, null, 2));
        return originalJson(data);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map