"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshableJwtAuth = exports.optionalJwtAuth = exports.jwtAuth = void 0;
const DB_1 = __importDefault(require("../services/DB"));
const JWTUtils_1 = require("../utils/JWTUtils");
const jwtAuth = (options = { required: true, allowRefresh: false }) => {
    return async (request, response) => {
        try {
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
                return;
            }
            const token = authHeader.substring(7);
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
            const decoded = JWTUtils_1.JWTUtils.verifyAccessToken(token);
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
            const user = await DB_1.default.from("users")
                .where("id", decoded.userId)
                .select([
                "id", "name", "email", "phone", "is_admin", "is_verified",
                "foto", "alamat", "jenis_kelamin_personal", "umur", "deskripsi",
                "instagram", "facebook", "twitter", "linkedin", "website",
                "is_verified_user"
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
            if (options.required && !user.is_verified) {
                return response.status(403).json({
                    statusCode: 403,
                    message: 'Akun belum diverifikasi',
                    errors: ['Silakan verifikasi akun Anda terlebih dahulu'],
                    data: null
                });
            }
            const session = await DB_1.default.from("sessions")
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
            request.user = user;
            request.sessionId = session.id;
            request.share = {
                "user": request.user,
                "sessionId": request.sessionId
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                if (options.allowRefresh) {
                    return response.status(401).json({
                        statusCode: 401,
                        message: 'Token telah kedaluwarsa',
                        errors: ['Token akses telah kedaluwarsa, gunakan refresh token'],
                        data: { needRefresh: true }
                    });
                }
                else {
                    return response.status(401).json({
                        statusCode: 401,
                        message: 'Token telah kedaluwarsa',
                        errors: ['Silakan login kembali'],
                        data: null
                    });
                }
            }
            else if (error.name === 'JsonWebTokenError') {
                if (options.required) {
                    return response.status(401).json({
                        statusCode: 401,
                        message: 'Token tidak valid',
                        errors: ['Format token tidak valid'],
                        data: null
                    });
                }
                return;
            }
            else {
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
exports.jwtAuth = jwtAuth;
exports.default = (0, exports.jwtAuth)({ required: true });
exports.optionalJwtAuth = (0, exports.jwtAuth)({ required: false });
exports.refreshableJwtAuth = (0, exports.jwtAuth)({ required: true, allowRefresh: true });
//# sourceMappingURL=jwtAuth.js.map