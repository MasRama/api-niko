import { Request, Response } from 'hyper-express';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

class RateLimiter {
    private store: RateLimitStore = {};
    private windowMs: number;
    private maxRequests: number;
    private cleanupInterval: NodeJS.Timeout;

    constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) { // 15 minutes, 100 requests
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        
        // Cleanup expired entries every 10 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 10 * 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        Object.keys(this.store).forEach(key => {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
            }
        });
    }

    private getKey(req: Request): string {
        // Use IP address as key, fallback to user ID if authenticated
        const ip = req.ip || (req as any).socket?.remoteAddress || 'unknown';
        const userId = (req as any).user?.id;
        return userId ? `user:${userId}` : `ip:${ip}`;
    }

    middleware = (req: Request, res: Response, next: () => void) => {
        const key = this.getKey(req);
        const now = Date.now();
        
        // Initialize or reset if window expired
        if (!this.store[key] || this.store[key].resetTime < now) {
            this.store[key] = {
                count: 0,
                resetTime: now + this.windowMs
            };
        }

        // Increment request count
        this.store[key].count++;

        // Check if limit exceeded
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

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (this.maxRequests - this.store[key].count).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(this.store[key].resetTime / 1000).toString());

        next();
    };

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Create different rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 20);  // 20 auth requests per 15 minutes
export const uploadRateLimiter = new RateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

export default apiRateLimiter; 