"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
class JWTUtils {
    static generateAccessToken(userId, email) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId,
            email,
            type: 'access',
            iat: now,
            exp: now + this.ACCESS_TOKEN_EXPIRY
        };
        return this.signToken(payload, this.JWT_SECRET);
    }
    static generateRefreshToken(userId, email) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId,
            email,
            type: 'refresh',
            iat: now,
            exp: now + this.REFRESH_TOKEN_EXPIRY
        };
        return this.signToken(payload, this.JWT_REFRESH_SECRET);
    }
    static generateTokenPair(userId, email) {
        const accessToken = this.generateAccessToken(userId, email);
        const refreshToken = this.generateRefreshToken(userId, email);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
            refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY
        };
    }
    static verifyAccessToken(token) {
        try {
            const payload = this.verifyToken(token, this.JWT_SECRET);
            if (payload.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            throw error;
        }
    }
    static verifyRefreshToken(token) {
        try {
            const payload = this.verifyToken(token, this.JWT_REFRESH_SECRET);
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            throw error;
        }
    }
    static decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payload = parts[1];
            const decoded = Buffer.from(payload, 'base64url').toString('utf8');
            return JSON.parse(decoded);
        }
        catch (error) {
            return null;
        }
    }
    static isTokenExpired(token) {
        const payload = this.decodeToken(token);
        if (!payload)
            return true;
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    }
    static getTokenExpiration(token) {
        const payload = this.decodeToken(token);
        if (!payload)
            return null;
        return payload.exp * 1000;
    }
    static signToken(payload, secret) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const data = `${encodedHeader}.${encodedPayload}`;
        const signature = crypto_1.default
            .createHmac('sha256', secret)
            .update(data)
            .digest('base64url');
        return `${data}.${signature}`;
    }
    static verifyToken(token, secret) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            const error = new Error('Invalid token format');
            error.name = 'JsonWebTokenError';
            throw error;
        }
        const [header, payload, signature] = parts;
        const data = `${header}.${payload}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(data)
            .digest('base64url');
        if (signature !== expectedSignature) {
            const error = new Error('Invalid signature');
            error.name = 'JsonWebTokenError';
            throw error;
        }
        let decodedPayload;
        try {
            const payloadString = Buffer.from(payload, 'base64url').toString('utf8');
            decodedPayload = JSON.parse(payloadString);
        }
        catch (error) {
            const jwtError = new Error('Invalid payload');
            jwtError.name = 'JsonWebTokenError';
            throw jwtError;
        }
        const now = Math.floor(Date.now() / 1000);
        if (decodedPayload.exp < now) {
            const error = new Error('Token expired');
            error.name = 'TokenExpiredError';
            throw error;
        }
        return decodedPayload;
    }
    static generateSecureId(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    static hashData(data, salt) {
        const actualSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
        const hash = crypto_1.default.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
        return `${actualSalt}:${hash.toString('hex')}`;
    }
    static verifyHashedData(data, hashedData) {
        const [salt, hash] = hashedData.split(':');
        const verifyHash = crypto_1.default.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
        return hash === verifyHash.toString('hex');
    }
}
exports.JWTUtils = JWTUtils;
JWTUtils.JWT_SECRET = process.env.JWT_SECRET || 'mcc-default-secret-key-2025';
JWTUtils.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mcc-refresh-secret-key-2025';
JWTUtils.ACCESS_TOKEN_EXPIRY = 60 * 60;
JWTUtils.REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60;
//# sourceMappingURL=JWTUtils.js.map