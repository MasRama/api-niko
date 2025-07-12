import DB from "../../services/DB";
import Authenticate from "../../services/Authenticate";
import { JWTUtils } from "../../utils/JWTUtils";
import { Request, Response } from "../../../type";
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import Mailer from "../../services/Mailer";
import UploadService from "../../services/UploadService";

class AuthApiController {
  /**
   * Login endpoint for mobile app
   * POST /api/v1/auth/login
   */
  public async login(request: Request, response: Response) {
    try {
      // Log raw request body sebelum parsing
      const rawBody = await request.text();
      console.log('Raw login request body:', {
        body: rawBody,
        headers: request.headers,
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString(),
      });
      
      // Parse JSON dari raw body
      const { email, password } = JSON.parse(rawBody);
      
      // Log request untuk endpoint login
      console.log('Login request received', {
        email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });

      // Validation
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

      // Find user by email or phone
      let user;
      if (email.includes("@")) {
        user = await DB.from("users").where("email", email.toLowerCase()).first();
      } else {
        user = await DB.from("users").where("phone", email).first();
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

      // Verify password
      const passwordMatch = await Authenticate.compare(password, user.password);
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

      // Skip email verification requirement as per latest requirement

      // Generate JWT tokens
      const tokens = JWTUtils.generateTokenPair(user.id, user.email);

      // Create session in database
      const sessionId = randomUUID();
      const deviceId = JWTUtils.generateSecureId(16);
      
      await DB.from("sessions").insert({
        id: sessionId,
        user_id: user.id,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: dayjs().add(tokens.expiresIn, 'seconds').toDate(),
        refresh_expires_at: dayjs().add(tokens.refreshExpiresIn, 'seconds').toDate(),
        device_type: 'mobile',
        device_id: deviceId,
        user_agent: request.headers["user-agent"] || null
      });



      const responseData = {
        statusCode: 200,
        message: "Login berhasil",
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          is_verified_user: true,
        },
      };
      // Log response untuk endpoint login
      console.log('Login response', {
        ...responseData,
        timestamp: new Date().toISOString(),
      });

      return response.status(200).json(responseData);

    } catch (error) {
      console.error('Login error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Register personal account
   * POST /api/v1/auth/register-personal
   */
  public async registerPersonal(request: Request, response: Response) {
    try {
      // Log mentah (raw) request body/form-data
      console.log('Raw register personal request (headers & body):', {
        headers: request.headers,
        // Catat info form-data mentah, jika ada
        method: request.method,
        url: request.url,
        // Tidak bisa log stream body secara langsung, jadi log info saja
        note: 'Form-data multipart diterima, parsing dimulai',
        timestamp: new Date().toISOString(),
      });

      // Parse multipart form data dengan handler yang sesuai
      const formData = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
        const fields: any = {};
        const files: any = {};
        
        request.multipart((field: any) => {
          if (field.file) {
            files[field.name] = field;
          } else {
            fields[field.name] = field.value;
          }
        }).then(() => {
          resolve({ fields, files });
        }).catch(reject);
      });
      
      const {
        pwd, konfirm_pwd, email, no_telp, nama, alamat,
        jenis_kelamin_personal, umur, deskripsi,
        facebook, instagram, twitter, youtube, tiktok
      } = formData.fields;

      // Gunakan field asli dari request tanpa mapping tambahan
      const password = pwd;

      // Log request untuk endpoint register personal (setelah parsing)
      console.log('Register personal request', {
        nama,
        email,
        no_telp,
        timestamp: new Date().toISOString(),
      });

      // Log fields dan files mentah hasil parsing
      console.log('Register personal parsed fields:', formData.fields);
      console.log('Register personal parsed files:', Object.keys(formData.files));

      const foto = formData.files?.foto;

      // Validasi
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

      // Cek apakah email sudah terdaftar
      const existingUser = await DB.from("users")
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

      // Handle upload file
      let fotoPath = null;
      if (foto) {
        fotoPath = await UploadService.save(foto, 'profiles');
      }

      // Buat user
      const userId = randomUUID();
      const hashedPassword = await Authenticate.hash(password);

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
        is_verified: true, // langsung verifikasi
        is_verified_user: true,
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      };

      await DB.from("users").insert(userData);

      // Generate token pair langsung setelah registrasi
      const tokens = JWTUtils.generateTokenPair(userId, email.toLowerCase());

      // Simpan session
      const sessionId = randomUUID();
      const deviceId = JWTUtils.generateSecureId(16);
      await DB.from("sessions").insert({
        id: sessionId,
        user_id: userId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: dayjs().add(tokens.expiresIn, 'seconds').toDate(),
        refresh_expires_at: dayjs().add(tokens.refreshExpiresIn, 'seconds').toDate(),
        device_type: 'mobile',
        device_id: deviceId,
        user_agent: request.headers["user-agent"] || null
      });

      // Skip sending verification email

      const registerPersonalResponse = {
        statusCode: 201,
        message: "Registrasi berhasil",
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          is_verified_user: true,
        },
      };

      // Log response untuk endpoint register personal
      console.log('Register personal response', {
        ...registerPersonalResponse,
        timestamp: new Date().toISOString(),
      });

      return response.status(201).json(registerPersonalResponse);

    } catch (error) {
      console.error('Register personal error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Register instansi account
   * POST /api/v1/auth/register-instansi
   */
  public async registerInstansi(request: Request, response: Response) {
    try {
      // Parse multipart form data with proper handler
      const formData = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
        const fields: any = {};
        const files: any = {};
        
        request.multipart((field: any) => {
          if (field.file) {
            files[field.name] = field;
          } else {
            fields[field.name] = field.value;
          }
        }).then(() => {
          resolve({ fields, files });
        }).catch(reject);
      });
      
      const {
        name, email, phone, password, alamat,
        nama_instansi, kategori_instansi_id, deskripsi_instansi,
        website_instansi, instagram_instansi, facebook_instansi
      } = formData.fields;

      // Log request untuk endpoint register instansi
      console.log('Register instansi request', {
        name,
        email,
        nama_instansi,
        timestamp: new Date().toISOString(),
      });

      const logo_instansi = formData.files?.logo_instansi;

      // Validation
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

      // Check if email already exists
      const existingUser = await DB.from("users")
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

      // Validate kategori_instansi_id
      const kategori = await DB.from("kategori_instansi")
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

      // Handle logo upload
      let logoPath = null;
      if (logo_instansi) {
        logoPath = await UploadService.save(logo_instansi, 'logos');
      }

      // Create user
      const userId = randomUUID();
      const hashedPassword = await Authenticate.hash(password);

      const userData = {
        id: userId,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        // alamat: alamat || null,
        is_verified: true, // langsung verifikasi
        is_verified_user: true,
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      };

      await DB.from("users").insert(userData);

      // Create instansi user record
      const instansiData = {
        id: randomUUID(),
        user_id: userId,
        nama_instansi,
        kategori_instansi_id,
        logo_instansi: logoPath,
        deskripsi_instansi: deskripsi_instansi || null,
        website_instansi: website_instansi || null,
        instagram_instansi: instagram_instansi || null,
        facebook_instansi: facebook_instansi || null,
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      };

      await DB.from("instansi_users").insert(instansiData);

      // Skip sending verification email

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

      // Log response untuk endpoint register instansi
      console.log('Register instansi response', {
        ...registerInstansiResponse,
        timestamp: new Date().toISOString(),
      });

      return response.status(201).json(registerInstansiResponse);

    } catch (error) {
      console.error('Register instansi error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Verify account with OTP
   * POST /api/v1/auth/verify-account
   */
  public async verifyAccount(request: Request, response: Response) {
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

      // Get temporary token from Authorization header
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
      const decoded = JWTUtils.verifyAccessToken(tempToken);

      if (!decoded) {
        return response.status(401).json({
          statusCode: 401,
          message: "Token tidak valid",
          errors: ["Token tidak dapat diverifikasi"],
          data: null
        });
      }

      // Find verification token
      const verificationToken = await DB.from("email_verification_tokens")
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

      // Update user verification status
      await DB.from("users")
        .where("id", decoded.userId)
        .update({ 
          is_verified: true,
          is_verified_user: true,
          updated_at: dayjs().toDate()
        });

      // Delete used verification token
      await DB.from("email_verification_tokens")
        .where("id", verificationToken.id)
        .delete();

      return response.status(200).json({
        statusCode: 200,
        message: "Verifikasi akun berhasil",
        data: {
          is_verified_user: true
        }
      });

    } catch (error) {
      console.error('Verify account error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  public async refreshToken(request: Request, response: Response) {
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

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refresh_token);

      if (!decoded) {
        return response.status(401).json({
          statusCode: 401,
          message: "Refresh token tidak valid",
          errors: ["Refresh token tidak dapat diverifikasi"],
          data: null
        });
      }

      // Check if session exists and refresh token matches
      const session = await DB.from("sessions")
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

      // Generate new access token
      const newAccessToken = JWTUtils.generateAccessToken(decoded.userId, decoded.email);

      // Update session with new access token
      await DB.from("sessions")
        .where("id", session.id)
        .update({
          access_token: newAccessToken,
          expires_at: dayjs().add(3600, 'seconds').toDate(), // 1 hour
          updated_at: dayjs().toDate()
        });

      return response.status(200).json({
        statusCode: 200,
        message: "Token berhasil diperbarui",
        data: {
          access_token: newAccessToken
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }



  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  public async logout(request: Request, response: Response) {
    try {
      // Delete session from database
      if (request.sessionId) {
        await DB.from("sessions")
          .where("id", request.sessionId)
          .delete();
      }

      return response.status(200).json({
        statusCode: 200,
        message: "Logout berhasil",
        data: null
      });

    } catch (error) {
      console.error('Logout error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(user: any) {
    try {
      // Generate OTP (6 digit number)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete any existing verification tokens for this user
      await DB.from("email_verification_tokens")
        .where("user_id", user.id)
        .delete();

      // Create new verification token
      await DB.from("email_verification_tokens").insert({
        user_id: user.id,
        token: otp,
        expires_at: dayjs().add(24, 'hours').toDate()
      });

      // Send email
      await Mailer.sendMail({
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

    } catch (error) {
      console.error('Send verification email error:', error);
      // Don't throw error, just log it
    }
  }
}

export default new AuthApiController();