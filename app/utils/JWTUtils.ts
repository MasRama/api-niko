import crypto from 'crypto';

interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'mcc-default-secret-key-2025';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mcc-refresh-secret-key-2025';
  private static readonly ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
  private static readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

  /**
   * Generate access token
   */
  static generateAccessToken(userId: string, email: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      userId,
      email,
      type: 'access',
      iat: now,
      exp: now + this.ACCESS_TOKEN_EXPIRY
    };

    return this.signToken(payload, this.JWT_SECRET);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, email: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      userId,
      email,
      type: 'refresh',
      iat: now,
      exp: now + this.REFRESH_TOKEN_EXPIRY
    };

    return this.signToken(payload, this.JWT_REFRESH_SECRET);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(userId: string, email: string): TokenPair {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshExpiresIn: this.REFRESH_TOKEN_EXPIRY
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = this.verifyToken(token, this.JWT_SECRET);
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw error; // Re-throw to be handled by middleware
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const payload = this.verifyToken(token, this.JWT_REFRESH_SECRET);
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw error; // Re-throw to be handled by middleware
    }
  }

  /**
   * Extract token payload without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Get token expiration time in milliseconds
   */
  static getTokenExpiration(token: string): number | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;

    return payload.exp * 1000; // Convert to milliseconds
  }

  /**
   * Sign JWT token using HMAC SHA256
   */
  private static signToken(payload: JWTPayload, secret: string): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    return `${data}.${signature}`;
  }

  /**
   * Verify JWT token using HMAC SHA256
   */
  private static verifyToken(token: string, secret: string): JWTPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      const error = new Error('Invalid token format');
      error.name = 'JsonWebTokenError';
      throw error;
    }

    const [header, payload, signature] = parts;
    
    // Verify signature
    const data = `${header}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSignature) {
      const error = new Error('Invalid signature');
      error.name = 'JsonWebTokenError';
      throw error;
    }

    // Parse payload
    let decodedPayload: JWTPayload;
    try {
      const payloadString = Buffer.from(payload, 'base64url').toString('utf8');
      decodedPayload = JSON.parse(payloadString);
    } catch (error) {
      const jwtError = new Error('Invalid payload');
      jwtError.name = 'JsonWebTokenError';
      throw jwtError;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp < now) {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    }

    return decodedPayload;
  }

  /**
   * Generate secure random string for device ID or session ID
   */
  static generateSecureId(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password or sensitive data
   */
  static hashData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  static verifyHashedData(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }
} 