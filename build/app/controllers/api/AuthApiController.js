"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
const Authenticate_1 = __importDefault(require("../../services/Authenticate"));
const JWTUtils_1 = require("../../utils/JWTUtils");
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const Mailer_1 = __importDefault(require("../../services/Mailer"));
const UploadService_1 = __importDefault(require("../../services/UploadService"));
class AuthApiController {
    async login(request, response) {
        try {
            const rawBody = await request.text();
            console.log('Raw login request body:', {
                body: rawBody,
                headers: request.headers,
                method: request.method,
                url: request.url,
                timestamp: new Date().toISOString(),
            });
            const { email, password, fcm_token } = JSON.parse(rawBody);
            console.log('Login request received', {
                email,
                hasPassword: !!password,
                fcm_token,
                timestamp: new Date().toISOString(),
            });
            if (!email || !password) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Email dan password wajib diisi",
                    errors: [
                        {
                            rule: "required",
                            field: "email",
                            message: "Email wajib diisi"
                        },
                        {
                            rule: "required",
                            field: "password",
                            message: "Password wajib diisi"
                        }
                    ],
                    data: null
                });
            }
            let user;
            if (email.includes("@")) {
                user = await DB_1.default.from("users").where("email", email.toLowerCase()).first();
            }
            else {
                user = await DB_1.default.from("users").where("phone", email).first();
            }
            if (!user) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Email/No.HP tidak terdaftar",
                    errors: [
                        {
                            rule: "exists",
                            field: "email",
                            message: "Email/No.HP tidak terdaftar"
                        }
                    ],
                    data: null
                });
            }
            const passwordMatch = await Authenticate_1.default.compare(password, user.password);
            if (!passwordMatch) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Password salah",
                    errors: [
                        {
                            rule: "invalid",
                            field: "password",
                            message: "Password salah"
                        }
                    ],
                    data: null
                });
            }
            const tokens = JWTUtils_1.JWTUtils.generateTokenPair(user.id, user.email);
            const sessionId = (0, crypto_1.randomUUID)();
            const deviceId = JWTUtils_1.JWTUtils.generateSecureId(16);
            await DB_1.default.from("sessions").insert({
                id: sessionId,
                user_id: user.id,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expires_at: (0, dayjs_1.default)().add(tokens.expiresIn, 'seconds').toDate(),
                refresh_expires_at: (0, dayjs_1.default)().add(tokens.refreshExpiresIn, 'seconds').toDate(),
                device_type: 'mobile',
                device_id: deviceId,
                fcm_token: fcm_token || null,
                user_agent: request.headers["user-agent"] || null
            });
            if (fcm_token) {
                await DB_1.default.from("users")
                    .where("id", user.id)
                    .update({ fcm_token });
            }
            const responseData = {
                statusCode: 200,
                message: "Login berhasil",
                data: {
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    is_verified_user: true,
                },
            };
            console.log('Login response', {
                ...responseData,
                timestamp: new Date().toISOString(),
            });
            return response.status(200).json(responseData);
        }
        catch (error) {
            console.error('Login error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async registerPersonal(request, response) {
        try {
            console.log('Raw register personal request (headers & body):', {
                headers: request.headers,
                method: request.method,
                url: request.url,
                note: 'Form-data multipart diterima, parsing dimulai',
                timestamp: new Date().toISOString(),
            });
            const formData = await new Promise((resolve, reject) => {
                const fields = {};
                const files = {};
                request.multipart((field) => {
                    if (field.file) {
                        files[field.name] = field;
                    }
                    else {
                        fields[field.name] = field.value;
                    }
                }).then(() => {
                    resolve({ fields, files });
                }).catch(reject);
            });
            const { pwd, konfirm_pwd, email, no_telp, nama, alamat, jenis_kelamin_personal, umur, deskripsi, facebook, instagram, twitter, youtube, tiktok } = formData.fields;
            const password = pwd;
            console.log('Register personal request', {
                nama,
                email,
                no_telp,
                timestamp: new Date().toISOString(),
            });
            console.log('Register personal parsed fields:', formData.fields);
            console.log('Register personal parsed files:', Object.keys(formData.files));
            const foto = formData.files?.foto;
            if (!nama || !email || !password) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Data wajib tidak lengkap",
                    errors: [
                        {
                            rule: "required",
                            field: "nama",
                            message: "Nama wajib diisi"
                        },
                        {
                            rule: "required",
                            field: "email",
                            message: "Email wajib diisi"
                        },
                        {
                            rule: "required",
                            field: "pwd",
                            message: "Password wajib diisi"
                        }
                    ],
                    data: null
                });
            }
            const existingUser = await DB_1.default.from("users")
                .where("email", email.toLowerCase())
                .first();
            if (existingUser) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Email sudah terdaftar",
                    errors: [
                        {
                            rule: "unique",
                            field: "email",
                            message: "Email sudah terdaftar"
                        }
                    ],
                    data: null
                });
            }
            let fotoPath = null;
            if (foto) {
                fotoPath = await UploadService_1.default.save(foto, 'profiles');
            }
            const userId = (0, crypto_1.randomUUID)();
            const hashedPassword = await Authenticate_1.default.hash(password);
            const userData = {
                id: userId,
                name: nama,
                email: email.toLowerCase(),
                phone: no_telp || null,
                password: hashedPassword,
                foto: fotoPath,
                alamat: alamat || null,
                jenis_kelamin_personal: jenis_kelamin_personal || null,
                umur: umur ? parseInt(umur) : null,
                deskripsi: deskripsi || null,
                instagram: instagram || null,
                facebook: facebook || null,
                twitter: twitter || null,
                youtube: youtube || null,
                tiktok: tiktok || null,
                is_verified: true,
                is_verified_user: true,
                created_at: (0, dayjs_1.default)().toDate(),
                updated_at: (0, dayjs_1.default)().toDate()
            };
            await DB_1.default.from("users").insert(userData);
            const tokens = JWTUtils_1.JWTUtils.generateTokenPair(userId, email.toLowerCase());
            const sessionId = (0, crypto_1.randomUUID)();
            const deviceId = JWTUtils_1.JWTUtils.generateSecureId(16);
            await DB_1.default.from("sessions").insert({
                id: sessionId,
                user_id: userId,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                expires_at: (0, dayjs_1.default)().add(tokens.expiresIn, 'seconds').toDate(),
                refresh_expires_at: (0, dayjs_1.default)().add(tokens.refreshExpiresIn, 'seconds').toDate(),
                device_type: 'mobile',
                device_id: deviceId,
                user_agent: request.headers["user-agent"] || null
            });
            const registerPersonalResponse = {
                statusCode: 201,
                message: "Registrasi berhasil",
                data: {
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    is_verified_user: true,
                },
            };
            console.log('Register personal response', {
                ...registerPersonalResponse,
                timestamp: new Date().toISOString(),
            });
            return response.status(201).json(registerPersonalResponse);
        }
        catch (error) {
            console.error('Register personal error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async registerInstansi(request, response) {
        try {
            const formData = await new Promise((resolve, reject) => {
                const fields = {};
                const files = {};
                request.multipart((field) => {
                    if (field.file) {
                        files[field.name] = field;
                    }
                    else {
                        fields[field.name] = field.value;
                    }
                }).then(() => {
                    resolve({ fields, files });
                }).catch(reject);
            });
            const { name, email, phone, password, alamat, nama_instansi, kategori_instansi_id, deskripsi_instansi, website_instansi, instagram_instansi, facebook_instansi } = formData.fields;
            console.log('Register instansi request', {
                name,
                email,
                nama_instansi,
                timestamp: new Date().toISOString(),
            });
            const logo_instansi = formData.files?.logo_instansi;
            if (!name || !email || !password || !nama_instansi || !kategori_instansi_id) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Data wajib tidak lengkap",
                    errors: [
                        {
                            rule: "required",
                            field: "nama_instansi",
                            message: "Nama instansi wajib diisi"
                        }
                    ],
                    data: null
                });
            }
            const existingUser = await DB_1.default.from("users")
                .where("email", email.toLowerCase())
                .first();
            if (existingUser) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Email sudah terdaftar",
                    errors: [
                        {
                            rule: "unique",
                            field: "email",
                            message: "Email sudah terdaftar"
                        }
                    ],
                    data: null
                });
            }
            const kategori = await DB_1.default.from("kategori_instansi")
                .where("id", kategori_instansi_id)
                .first();
            if (!kategori) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Kategori instansi tidak valid",
                    errors: [
                        {
                            rule: "exists",
                            field: "kategori_instansi_id",
                            message: "Kategori instansi tidak ditemukan"
                        }
                    ],
                    data: null
                });
            }
            let logoPath = null;
            if (logo_instansi) {
                logoPath = await UploadService_1.default.save(logo_instansi, 'logos');
            }
            const userId = (0, crypto_1.randomUUID)();
            const hashedPassword = await Authenticate_1.default.hash(password);
            const userData = {
                id: userId,
                name,
                email: email.toLowerCase(),
                phone: phone || null,
                password: hashedPassword,
                is_verified: true,
                is_verified_user: true,
                created_at: (0, dayjs_1.default)().toDate(),
                updated_at: (0, dayjs_1.default)().toDate()
            };
            await DB_1.default.from("users").insert(userData);
            const instansiData = {
                id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                nama_instansi,
                kategori_instansi_id,
                logo_instansi: logoPath,
                deskripsi_instansi: deskripsi_instansi || null,
                website_instansi: website_instansi || null,
                instagram_instansi: instagram_instansi || null,
                facebook_instansi: facebook_instansi || null,
                created_at: (0, dayjs_1.default)().toDate(),
                updated_at: (0, dayjs_1.default)().toDate()
            };
            await DB_1.default.from("instansi_users").insert(instansiData);
            const registerInstansiResponse = {
                statusCode: 201,
                message: "Registrasi instansi berhasil. Silakan cek email untuk verifikasi akun.",
                data: {
                    user_id: userId,
                    email: userData.email,
                    instansi_id: instansiData.id,
                    is_verified: true,
                },
            };
            console.log('Register instansi response', {
                ...registerInstansiResponse,
                timestamp: new Date().toISOString(),
            });
            return response.status(201).json(registerInstansiResponse);
        }
        catch (error) {
            console.error('Register instansi error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async verifyAccount(request, response) {
        try {
            const { otp } = await request.json();
            if (!otp) {
                return response.status(400).json({
                    statusCode: 400,
                    message: "Kode OTP wajib diisi",
                    errors: {},
                    data: null
                });
            }
            const authHeader = request.header('authorization') || request.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return response.status(401).json({
                    statusCode: 401,
                    message: "Token tidak valid",
                    errors: ["Authorization header diperlukan"],
                    data: null
                });
            }
            const tempToken = authHeader.substring(7);
            const decoded = JWTUtils_1.JWTUtils.verifyAccessToken(tempToken);
            if (!decoded) {
                return response.status(401).json({
                    statusCode: 401,
                    message: "Token tidak valid",
                    errors: ["Token tidak dapat diverifikasi"],
                    data: null
                });
            }
            const verificationToken = await DB_1.default.from("email_verification_tokens")
                .where("user_id", decoded.userId)
                .where("token", otp)
                .where("expires_at", ">", new Date())
                .first();
            if (!verificationToken) {
                return response.status(400).json({
                    statusCode: 400,
                    message: "Kode OTP tidak valid atau sudah kadaluarsa",
                    errors: {},
                    data: null
                });
            }
            await DB_1.default.from("users")
                .where("id", decoded.userId)
                .update({
                is_verified: true,
                is_verified_user: true,
                updated_at: (0, dayjs_1.default)().toDate()
            });
            await DB_1.default.from("email_verification_tokens")
                .where("id", verificationToken.id)
                .delete();
            return response.status(200).json({
                statusCode: 200,
                message: "Verifikasi akun berhasil",
                data: {
                    is_verified_user: true
                }
            });
        }
        catch (error) {
            console.error('Verify account error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async refreshToken(request, response) {
        try {
            const { refresh_token } = await request.json();
            if (!refresh_token) {
                return response.status(400).json({
                    statusCode: 400,
                    message: "Refresh token wajib diisi",
                    errors: ["Refresh token diperlukan"],
                    data: null
                });
            }
            const decoded = JWTUtils_1.JWTUtils.verifyRefreshToken(refresh_token);
            if (!decoded) {
                return response.status(401).json({
                    statusCode: 401,
                    message: "Refresh token tidak valid",
                    errors: ["Refresh token tidak dapat diverifikasi"],
                    data: null
                });
            }
            const session = await DB_1.default.from("sessions")
                .where("user_id", decoded.userId)
                .where("refresh_token", refresh_token)
                .where("refresh_expires_at", ">", new Date())
                .first();
            if (!session) {
                return response.status(401).json({
                    statusCode: 401,
                    message: "Refresh token tidak valid atau sudah kadaluarsa",
                    errors: ["Silakan login kembali"],
                    data: null
                });
            }
            const newAccessToken = JWTUtils_1.JWTUtils.generateAccessToken(decoded.userId, decoded.email);
            await DB_1.default.from("sessions")
                .where("id", session.id)
                .update({
                access_token: newAccessToken,
                expires_at: (0, dayjs_1.default)().add(3600, 'seconds').toDate(),
                updated_at: (0, dayjs_1.default)().toDate()
            });
            return response.status(200).json({
                statusCode: 200,
                message: "Token berhasil diperbarui",
                data: {
                    access_token: newAccessToken
                }
            });
        }
        catch (error) {
            console.error('Refresh token error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async saveFcmToken(request, response) {
        try {
            const { fcm_token } = await request.json();
            if (!fcm_token) {
                return response.status(400).json({
                    statusCode: 400,
                    message: "FCM token wajib diisi",
                    errors: ["FCM token diperlukan"],
                    data: null
                });
            }
            await DB_1.default.from("users")
                .where("id", request.user.id)
                .update({
                fcm_token,
                updated_at: (0, dayjs_1.default)().toDate()
            });
            if (request.sessionId) {
                await DB_1.default.from("sessions")
                    .where("id", request.sessionId)
                    .update({
                    fcm_token,
                    updated_at: (0, dayjs_1.default)().toDate()
                });
            }
            return response.status(200).json({
                statusCode: 200,
                message: "FCM token berhasil disimpan",
                data: {
                    fcm_token
                }
            });
        }
        catch (error) {
            console.error('Save FCM token error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async logout(request, response) {
        try {
            if (request.sessionId) {
                await DB_1.default.from("sessions")
                    .where("id", request.sessionId)
                    .delete();
            }
            return response.status(200).json({
                statusCode: 200,
                message: "Logout berhasil",
                data: null
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async sendVerificationEmail(user) {
        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await DB_1.default.from("email_verification_tokens")
                .where("user_id", user.id)
                .delete();
            await DB_1.default.from("email_verification_tokens").insert({
                user_id: user.id,
                token: otp,
                expires_at: (0, dayjs_1.default)().add(24, 'hours').toDate()
            });
            await Mailer_1.default.sendMail({
                from: process.env.USER_MAILER,
                to: user.email,
                subject: "Verifikasi Akun MCC",
                text: `Halo ${user.name},

Terima kasih telah mendaftar di MCC. Gunakan kode OTP berikut untuk verifikasi akun Anda:

${otp}

Kode ini akan kadaluarsa dalam 24 jam.

Jika Anda tidak merasa mendaftar, abaikan email ini.

Salam,
Tim MCC`
            });
        }
        catch (error) {
            console.error('Send verification email error:', error);
        }
    }
}
exports.default = new AuthApiController();
//# sourceMappingURL=AuthApiController.js.map