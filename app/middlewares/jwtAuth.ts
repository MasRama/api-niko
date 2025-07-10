import DB from "../services/DB";
import { Request, Response } from "../../type";
import { JWTUtils } from "../utils/JWTUtils";

interface JWTAuthOptions {
  required?: boolean;
  allowRefresh?: boolean;
}

export const jwtAuth = (options: JWTAuthOptions = { required: true, allowRefresh: false }) => {
  return async (request: Request, response: Response) => {
    try {
      // Extract Bearer token from Authorization header
      const authHeader = request.header('authorization') || request.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'Token akses diperlukan',
            errors: ['Authorization header dengan Bearer token diperlukan'],
            data: null
          });
        }
        return; // Continue without authentication if not required
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'Token tidak valid',
            errors: ['Token tidak ditemukan'],
            data: null
          });
        }
        return;
      }

      // Verify JWT token
      const decoded = JWTUtils.verifyAccessToken(token);
      
      if (!decoded || !decoded.userId) {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'Token tidak valid',
            errors: ['Token tidak dapat diverifikasi'],
            data: null
          });
        }
        return;
      }

      // Get user from database
      const user = await DB.from("users")
        .where("id", decoded.userId)
        .select([
          "id", "name", "email", "phone", "is_admin", "is_verified", 
          "foto", "alamat", "jenis_kelamin_personal", "umur", "deskripsi",
          "instagram", "facebook", "twitter", "linkedin", "website",
          "fcm_token", "is_verified_user"
        ])
        .first();

      if (!user) {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'User tidak ditemukan',
            errors: ['User dengan token ini tidak ditemukan'],
            data: null
          });
        }
        return;
      }

      // Check if user is verified for sensitive operations
      if (options.required && !user.is_verified) {
        return response.status(403).json({
          statusCode: 403,
          message: 'Akun belum diverifikasi',
          errors: ['Silakan verifikasi akun Anda terlebih dahulu'],
          data: null
        });
      }

      // Check if session still exists (for logout handling)
      const session = await DB.from("sessions")
        .where("user_id", user.id)
        .where("access_token", token)
        .where("expires_at", ">", new Date())
        .first();

      if (!session) {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'Sesi telah berakhir',
            errors: ['Silakan login kembali'],
            data: null
          });
        }
        return;
      }

      // Set user info to request
      request.user = user;
      request.sessionId = session.id;
      
      // Set share data for views (if needed)
      request.share = {
        "user": request.user,
        "sessionId": request.sessionId
      };

    } catch (error: any) {
      // Handle JWT specific errors
      if (error.name === 'TokenExpiredError') {
        if (options.allowRefresh) {
          // Return specific error for token refresh
          return response.status(401).json({
            statusCode: 401,
            message: 'Token telah kedaluwarsa',
            errors: ['Token akses telah kedaluwarsa, gunakan refresh token'],
            data: { needRefresh: true }
          });
        } else {
          return response.status(401).json({
            statusCode: 401,
            message: 'Token telah kedaluwarsa',
            errors: ['Silakan login kembali'],
            data: null
          });
        }
      } else if (error.name === 'JsonWebTokenError') {
        if (options.required) {
          return response.status(401).json({
            statusCode: 401,
            message: 'Token tidak valid',
            errors: ['Format token tidak valid'],
            data: null
          });
        }
        return;
      } else {
        console.error('JWT Auth Error:', error);
        if (options.required) {
          return response.status(500).json({
            statusCode: 500,
            message: 'Terjadi kesalahan server',
            errors: ['Gagal memverifikasi token'],
            data: null
          });
        }
        return;
      }
    }
  };
};

// Export default middleware with required auth
export default jwtAuth({ required: true });

// Export optional middleware for public endpoints with user context
export const optionalJwtAuth = jwtAuth({ required: false });

// Export middleware that allows refresh token flow
export const refreshableJwtAuth = jwtAuth({ required: true, allowRefresh: true }); 