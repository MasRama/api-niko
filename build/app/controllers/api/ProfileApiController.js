"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
const dayjs_1 = __importDefault(require("dayjs"));
class ProfileApiController {
    async getProfile(request, response) {
        try {
            const userId = request.user.id;
            const user = await DB_1.default.from("users")
                .where("id", userId)
                .select([
                "id", "name", "email", "phone", "foto", "alamat",
                "jenis_kelamin_personal", "umur", "deskripsi",
                "instagram", "facebook", "twitter", "linkedin", "website",
                "is_verified", "is_verified_user"
            ])
                .first();
            if (!user) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "User tidak ditemukan",
                    errors: ["User tidak ditemukan"],
                    data: null
                });
            }
            const profileData = {
                id: user.id,
                email: user.email,
                nama: user.name,
                no_telp: user.phone,
                foto: user.foto,
                alamat: user.alamat,
                jenis_kelamin_personal: user.jenis_kelamin_personal,
                umur: user.umur,
                deskripsi: user.deskripsi,
                facebook: user.facebook,
                instagram: user.instagram,
                twitter: user.twitter,
                linkedin: user.linkedin,
                website: user.website,
                youtube: null,
                tiktok: null
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Profile berhasil diambil",
                data: profileData
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async updateProfile(request, response) {
        try {
            const userId = request.user.id;
            let updateData = {};
            let foto = null;
            if (request.headers['content-type']?.includes('multipart/form-data')) {
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
                updateData = formData.fields;
                foto = formData.files?.foto;
            }
            else {
                updateData = await request.json();
            }
            const existingUser = await DB_1.default.from("users").where("id", userId).first();
            if (!existingUser) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "User tidak ditemukan",
                    errors: ["User tidak ditemukan"],
                    data: null
                });
            }
            const fieldsToUpdate = {};
            if (updateData.nama)
                fieldsToUpdate.name = updateData.nama;
            if (updateData.email)
                fieldsToUpdate.email = updateData.email.toLowerCase();
            if (updateData.no_telp)
                fieldsToUpdate.phone = updateData.no_telp;
            if (updateData.alamat)
                fieldsToUpdate.alamat = updateData.alamat;
            if (updateData.jenis_kelamin_personal)
                fieldsToUpdate.jenis_kelamin_personal = updateData.jenis_kelamin_personal;
            if (updateData.umur)
                fieldsToUpdate.umur = parseInt(updateData.umur);
            if (updateData.deskripsi)
                fieldsToUpdate.deskripsi = updateData.deskripsi;
            if (updateData.facebook)
                fieldsToUpdate.facebook = updateData.facebook;
            if (updateData.instagram)
                fieldsToUpdate.instagram = updateData.instagram;
            if (updateData.twitter)
                fieldsToUpdate.twitter = updateData.twitter;
            if (updateData.linkedin)
                fieldsToUpdate.linkedin = updateData.linkedin;
            if (updateData.website)
                fieldsToUpdate.website = updateData.website;
            if (foto) {
                const fileName = `${Date.now()}_${foto.filename}`;
                const fotoPath = `uploads/profiles/${fileName}`;
                fieldsToUpdate.foto = fotoPath;
            }
            if (fieldsToUpdate.email && fieldsToUpdate.email !== existingUser.email) {
                const emailExists = await DB_1.default.from("users")
                    .where("email", fieldsToUpdate.email)
                    .where("id", "!=", userId)
                    .first();
                if (emailExists) {
                    return response.status(422).json({
                        statusCode: 422,
                        message: "Email sudah digunakan",
                        errors: [
                            {
                                rule: "unique",
                                field: "email",
                                message: "Email sudah digunakan oleh user lain"
                            }
                        ],
                        data: null
                    });
                }
            }
            fieldsToUpdate.updated_at = (0, dayjs_1.default)().toDate();
            await DB_1.default.from("users")
                .where("id", userId)
                .update(fieldsToUpdate);
            const updatedUser = await DB_1.default.from("users")
                .where("id", userId)
                .select([
                "id", "name", "email", "phone", "foto", "alamat",
                "jenis_kelamin_personal", "umur", "deskripsi",
                "instagram", "facebook", "twitter", "linkedin", "website"
            ])
                .first();
            const profileData = {
                id: updatedUser.id,
                email: updatedUser.email,
                nama: updatedUser.name,
                no_telp: updatedUser.phone,
                foto: updatedUser.foto,
                alamat: updatedUser.alamat,
                jenis_kelamin_personal: updatedUser.jenis_kelamin_personal,
                umur: updatedUser.umur,
                deskripsi: updatedUser.deskripsi,
                facebook: updatedUser.facebook,
                instagram: updatedUser.instagram,
                twitter: updatedUser.twitter,
                linkedin: updatedUser.linkedin,
                website: updatedUser.website,
                youtube: null,
                tiktok: null
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Profile berhasil diperbarui",
                data: profileData
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getInstansiProfile(request, response) {
        try {
            const userId = request.user.id;
            const instansi = await DB_1.default.from("instansi_users as iu")
                .leftJoin("kategori_instansi as ki", "iu.kategori_instansi_id", "ki.id")
                .where("iu.user_id", userId)
                .select([
                "iu.id",
                "iu.nama_instansi",
                "iu.logo_instansi",
                "iu.deskripsi_instansi",
                "iu.website_instansi",
                "iu.instagram_instansi",
                "iu.facebook_instansi",
                "ki.id as kategori_id",
                "ki.nama as kategori_nama"
            ])
                .first();
            if (!instansi) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "Data instansi tidak ditemukan",
                    errors: ["User belum memiliki data instansi"],
                    data: null
                });
            }
            const instansiData = {
                id: instansi.id,
                nama_instansi: instansi.nama_instansi,
                logo_instansi: instansi.logo_instansi,
                deskripsi_instansi: instansi.deskripsi_instansi,
                website_instansi: instansi.website_instansi,
                instagram_instansi: instansi.instagram_instansi,
                facebook_instansi: instansi.facebook_instansi,
                kategori: {
                    id: instansi.kategori_id,
                    nama: instansi.kategori_nama
                }
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Data instansi berhasil diambil",
                data: instansiData
            });
        }
        catch (error) {
            console.error('Get instansi profile error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async updateInstansiProfile(request, response) {
        try {
            const userId = request.user.id;
            let updateData = {};
            let logo = null;
            if (request.headers['content-type']?.includes('multipart/form-data')) {
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
                updateData = formData.fields;
                logo = formData.files?.logo_instansi;
            }
            else {
                updateData = await request.json();
            }
            const existingInstansi = await DB_1.default.from("instansi_users")
                .where("user_id", userId)
                .first();
            if (!existingInstansi) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "Data instansi tidak ditemukan",
                    errors: ["User belum memiliki data instansi"],
                    data: null
                });
            }
            const fieldsToUpdate = {};
            if (updateData.nama_instansi)
                fieldsToUpdate.nama_instansi = updateData.nama_instansi;
            if (updateData.kategori_instansi_id) {
                const kategori = await DB_1.default.from("kategori_instansi")
                    .where("id", updateData.kategori_instansi_id)
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
                fieldsToUpdate.kategori_instansi_id = updateData.kategori_instansi_id;
            }
            if (updateData.deskripsi_instansi)
                fieldsToUpdate.deskripsi_instansi = updateData.deskripsi_instansi;
            if (updateData.website_instansi)
                fieldsToUpdate.website_instansi = updateData.website_instansi;
            if (updateData.instagram_instansi)
                fieldsToUpdate.instagram_instansi = updateData.instagram_instansi;
            if (updateData.facebook_instansi)
                fieldsToUpdate.facebook_instansi = updateData.facebook_instansi;
            if (logo) {
                const fileName = `${Date.now()}_${logo.filename}`;
                const logoPath = `uploads/logos/${fileName}`;
                fieldsToUpdate.logo_instansi = logoPath;
            }
            fieldsToUpdate.updated_at = (0, dayjs_1.default)().toDate();
            await DB_1.default.from("instansi_users")
                .where("user_id", userId)
                .update(fieldsToUpdate);
            const updatedInstansi = await DB_1.default.from("instansi_users as iu")
                .leftJoin("kategori_instansi as ki", "iu.kategori_instansi_id", "ki.id")
                .where("iu.user_id", userId)
                .select([
                "iu.id",
                "iu.nama_instansi",
                "iu.logo_instansi",
                "iu.deskripsi_instansi",
                "iu.website_instansi",
                "iu.instagram_instansi",
                "iu.facebook_instansi",
                "ki.id as kategori_id",
                "ki.nama as kategori_nama"
            ])
                .first();
            const instansiData = {
                id: updatedInstansi.id,
                nama_instansi: updatedInstansi.nama_instansi,
                logo_instansi: updatedInstansi.logo_instansi,
                deskripsi_instansi: updatedInstansi.deskripsi_instansi,
                website_instansi: updatedInstansi.website_instansi,
                instagram_instansi: updatedInstansi.instagram_instansi,
                facebook_instansi: updatedInstansi.facebook_instansi,
                kategori: {
                    id: updatedInstansi.kategori_id,
                    nama: updatedInstansi.kategori_nama
                }
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Data instansi berhasil diperbarui",
                data: instansiData
            });
        }
        catch (error) {
            console.error('Update instansi profile error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getKategoriInstansi(request, response) {
        try {
            const kategoriList = await DB_1.default.from("kategori_instansi")
                .select(["id", "nama", "deskripsi"])
                .where("is_active", true)
                .orderBy("nama", "asc");
            return response.status(200).json({
                statusCode: 200,
                message: "Kategori instansi berhasil diambil",
                data: kategoriList
            });
        }
        catch (error) {
            console.error('Get kategori instansi error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async changePassword(request, response) {
        try {
            const { oldPassword, newPassword } = await request.json();
            const userId = request.user.id;
            if (!oldPassword || !newPassword) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Password lama dan baru wajib diisi",
                    errors: [
                        {
                            rule: "required",
                            field: "oldPassword",
                            message: "Password lama wajib diisi"
                        },
                        {
                            rule: "required",
                            field: "newPassword",
                            message: "Password baru wajib diisi"
                        }
                    ],
                    data: null
                });
            }
            const user = await DB_1.default.from("users")
                .where("id", userId)
                .select(["password"])
                .first();
            if (!user) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "User tidak ditemukan",
                    errors: ["User tidak ditemukan"],
                    data: null
                });
            }
            const Authenticate = (await Promise.resolve().then(() => __importStar(require("../../services/Authenticate")))).default;
            const passwordMatch = await Authenticate.compare(oldPassword, user.password);
            if (!passwordMatch) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Password lama tidak cocok",
                    errors: [
                        {
                            rule: "invalid",
                            field: "oldPassword",
                            message: "Password lama tidak cocok"
                        }
                    ],
                    data: null
                });
            }
            const hashedNewPassword = await Authenticate.hash(newPassword);
            await DB_1.default.from("users")
                .where("id", userId)
                .update({
                password: hashedNewPassword,
                updated_at: (0, dayjs_1.default)().toDate()
            });
            return response.status(200).json({
                statusCode: 200,
                message: "Password berhasil diubah",
                data: {
                    success: true
                }
            });
        }
        catch (error) {
            console.error('Change password error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
}
exports.default = new ProfileApiController();
//# sourceMappingURL=ProfileApiController.js.map