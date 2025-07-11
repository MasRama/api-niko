import DB from "../../services/DB";
import { Request, Response } from "../../../type";
import dayjs from "dayjs";
import UploadService from "../../services/UploadService";

class ProfileApiController {
  /**
   * Get user profile
   * GET /api/v1/users/profile-user
   */
  public async getProfile(request: Request, response: Response) {
    try {
      const userId = request.user.id;

      // Get user data
      const user = await DB.from("users")
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

      // Format response sesuai frontend model
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
        youtube: null, // Field tambahan yang ada di frontend
        tiktok: null   // Field tambahan yang ada di frontend
      };

      return response.status(200).json({
        statusCode: 200,
        message: "Profile berhasil diambil",
        data: profileData
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Update user profile
   * PATCH /api/v1/users/profile-user
   */
  public async updateProfile(request: Request, response: Response) {
    try {
      const userId = request.user.id;

      // Check if request is multipart (with file upload)
      let updateData: any = {};
      let foto = null;

      if (request.headers['content-type']?.includes('multipart/form-data')) {
        // Handle multipart form data with proper handler
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
        
        updateData = formData.fields;
        foto = formData.files?.foto;
      } else {
        // Handle JSON data
        updateData = await request.json();
      }

      // Validate user exists
      const existingUser = await DB.from("users").where("id", userId).first();
      if (!existingUser) {
        return response.status(404).json({
          statusCode: 404,
          message: "User tidak ditemukan",
          errors: ["User tidak ditemukan"],
          data: null
        });
      }

      // Prepare update object
      const fieldsToUpdate: any = {};

      // Map frontend field names to database field names
      if (updateData.nama) fieldsToUpdate.name = updateData.nama;
      if (updateData.email) fieldsToUpdate.email = updateData.email.toLowerCase();
      if (updateData.no_telp) fieldsToUpdate.phone = updateData.no_telp;
      if (updateData.alamat) fieldsToUpdate.alamat = updateData.alamat;
      if (updateData.jenis_kelamin_personal) fieldsToUpdate.jenis_kelamin_personal = updateData.jenis_kelamin_personal;
      if (updateData.umur) fieldsToUpdate.umur = parseInt(updateData.umur);
      if (updateData.deskripsi) fieldsToUpdate.deskripsi = updateData.deskripsi;
      if (updateData.facebook) fieldsToUpdate.facebook = updateData.facebook;
      if (updateData.instagram) fieldsToUpdate.instagram = updateData.instagram;
      if (updateData.twitter) fieldsToUpdate.twitter = updateData.twitter;
      if (updateData.linkedin) fieldsToUpdate.linkedin = updateData.linkedin;
      if (updateData.website) fieldsToUpdate.website = updateData.website;

      // Handle file upload
      if (foto) {
        const fotoPathSaved = await UploadService.save(foto, 'profiles');
        fieldsToUpdate.foto = fotoPathSaved;
      }

      // Check if email is being changed and already exists
      if (fieldsToUpdate.email && fieldsToUpdate.email !== existingUser.email) {
        const emailExists = await DB.from("users")
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

      // Add updated_at timestamp
      fieldsToUpdate.updated_at = dayjs().toDate();

      // Update user data
      await DB.from("users")
        .where("id", userId)
        .update(fieldsToUpdate);

      // Get updated user data
      const updatedUser = await DB.from("users")
        .where("id", userId)
        .select([
          "id", "name", "email", "phone", "foto", "alamat", 
          "jenis_kelamin_personal", "umur", "deskripsi",
          "instagram", "facebook", "twitter", "linkedin", "website"
        ])
        .first();

      // Format response sesuai frontend model
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

    } catch (error) {
      console.error('Update profile error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get instansi profile
   * GET /api/v1/users/instansi-profile
   */
  public async getInstansiProfile(request: Request, response: Response) {
    try {
      const userId = request.user.id;

      // Get instansi data with kategori
      const instansi = await DB.from("instansi_users as iu")
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

      // Format response
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

    } catch (error) {
      console.error('Get instansi profile error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Update instansi profile
   * PATCH /api/v1/users/instansi-profile
   */
  public async updateInstansiProfile(request: Request, response: Response) {
    try {
      const userId = request.user.id;

      // Check if request is multipart (with file upload)
      let updateData: any = {};
      let logo = null;

      if (request.headers['content-type']?.includes('multipart/form-data')) {
        // Handle multipart form data with proper handler
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
        
        updateData = formData.fields;
        logo = formData.files?.logo_instansi;
      } else {
        // Handle JSON data
        updateData = await request.json();
      }

      // Check if instansi exists
      const existingInstansi = await DB.from("instansi_users")
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

      // Prepare update object
      const fieldsToUpdate: any = {};

      if (updateData.nama_instansi) fieldsToUpdate.nama_instansi = updateData.nama_instansi;
      if (updateData.kategori_instansi_id) {
        // Validate kategori exists
        const kategori = await DB.from("kategori_instansi")
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
      if (updateData.deskripsi_instansi) fieldsToUpdate.deskripsi_instansi = updateData.deskripsi_instansi;
      if (updateData.website_instansi) fieldsToUpdate.website_instansi = updateData.website_instansi;
      if (updateData.instagram_instansi) fieldsToUpdate.instagram_instansi = updateData.instagram_instansi;
      if (updateData.facebook_instansi) fieldsToUpdate.facebook_instansi = updateData.facebook_instansi;

      // Handle logo upload
      if (logo) {
        const logoPathSaved = await UploadService.save(logo, 'logos');
        fieldsToUpdate.logo_instansi = logoPathSaved;
      }

      // Add updated_at timestamp
      fieldsToUpdate.updated_at = dayjs().toDate();

      // Update instansi data
      await DB.from("instansi_users")
        .where("user_id", userId)
        .update(fieldsToUpdate);

      // Get updated instansi data with kategori
      const updatedInstansi = await DB.from("instansi_users as iu")
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

      // Format response
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

    } catch (error) {
      console.error('Update instansi profile error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get list kategori instansi
   * GET /api/v1/users/kategori-instansi
   */
  public async getKategoriInstansi(request: Request, response: Response) {
    try {
      const kategoriList = await DB.from("kategori_instansi")
        .select(["id", "nama", "deskripsi"])
        .where("is_active", true)
        .orderBy("nama", "asc");

      return response.status(200).json({
        statusCode: 200,
        message: "Kategori instansi berhasil diambil",
        data: kategoriList
      });

    } catch (error) {
      console.error('Get kategori instansi error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/reset-password
   */
  public async changePassword(request: Request, response: Response) {
    try {
      const { oldPassword, newPassword } = await request.json();
      const userId = request.user.id;

      // Validation
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

      // Get user current password
      const user = await DB.from("users")
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

      // Import Authenticate service
      const Authenticate = (await import("../../services/Authenticate")).default;

      // Verify old password
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

      // Hash new password
      const hashedNewPassword = await Authenticate.hash(newPassword);

      // Update password
      await DB.from("users")
        .where("id", userId)
        .update({
          password: hashedNewPassword,
          updated_at: dayjs().toDate()
        });

      return response.status(200).json({
        statusCode: 200,
        message: "Password berhasil diubah",
        data: {
          success: true
        }
      });

    } catch (error) {
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

export default new ProfileApiController(); 