"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimiter = exports.authRateLimiter = exports.apiRateLimiter = void 0;
class RateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
        this.store = {};
        this.middleware = (req, res, next) => {
            const key = this.getKey(req);
            const now = Date.now();
            if (!this.store[key] || this.store[key].resetTime < now) {
                this.store[key] = {
                    count: 0,
                    resetTime: now + this.windowMs
                };
            }
            this.store[key].count++;
            if (this.store[key].count > this.maxRequests) {
                const resetIn = Math.ceil((this.store[key].resetTime - now) / 1000);
                res.status(429).json({
                    statusCode: 429,
                    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                    errors: {
                        rate_limit: `Limit ${this.maxRequests} permintaan per ${this.windowMs / 60000} menit terlampaui`,
                        reset_in: `${resetIn} detik`
                    }
                });
                return;
            }
            res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', (this.maxRequests - this.store[key].count).toString());
            res.setHeader('X-RateLimit-Reset', Math.ceil(this.store[key].resetTime / 1000).toString());
            next();
        };
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 10 * 60 * 1000);
    }
    cleanup() {
        const now = Date.now();
        Object.keys(this.store).forEach(key => {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
            }
        });
    }
    getKey(req) {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const userId = req.user?.id;
        return userId ? `user:${userId}` : `ip:${ip}`;
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
exports.apiRateLimiter = new RateLimiter(15 * 60 * 1000, 100);
exports.authRateLimiter = new RateLimiter(15 * 60 * 1000, 20);
exports.uploadRateLimiter = new RateLimiter(60 * 60 * 1000, 10);
exports.default = exports.apiRateLimiter;
//# sourceMappingURL=rate_limiter.js.map