import DB from "../../services/DB";
import { Request, Response } from "../../../type";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

// Safe casting helper for query parameters
const toNumber = (value: any, defaultVal: number = 0): number => {
  if (Array.isArray(value)) value = value[0];
  const n = parseInt(String(value));
  return isNaN(n) ? defaultVal : n;
};

class FeedbackApiController {
  /**
   * Create feedback data diri (base feedback record)
   * POST /api/v1/feedback-data-diri/create
   */
  public async createFeedbackDataDiri(request: Request, response: Response) {
    try {
      const userId = request.user?.id || null; // Could be anonymous feedback
      
      const {
        nama_depan,
        nama_belakang,
        email,
        no_telp,
        usia,
        jenis_kelamin,
        pendidikan_terakhir,
        pekerjaan,
        instansi,
        jabatan,
        alamat,
        frekuensi_kunjungan,
        responden_id = 1 // Default to 'Pengguna Fasilitas'
      } = request.body;

      // Validation required fields
      if (!nama_depan || !email || !no_telp) {
        return response.status(422).json({
          statusCode: 422,
          message: "Data wajib tidak lengkap",
          errors: [
            {
              rule: "required",
              field: "nama_depan",
              message: "Nama depan wajib diisi"
            },
            {
              rule: "required", 
              field: "email",
              message: "Email wajib diisi"
            },
            {
              rule: "required",
              field: "no_telp", 
              message: "Nomor telepon wajib diisi"
            }
          ],
          data: null
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return response.status(422).json({
          statusCode: 422,
          message: "Format email tidak valid",
          errors: [
            {
              rule: "email",
              field: "email",
              message: "Format email tidak valid"
            }
          ],
          data: null
        });
      }

      // Check if responden_id exists
      const respondenExists = await DB.from("responden")
        .where("id", responden_id)
        .where("is_active", true)
        .first();

      if (!respondenExists) {
        return response.status(422).json({
          statusCode: 422,
          message: "Tipe responden tidak valid",
          errors: [
            {
              rule: "exists",
              field: "responden_id",
              message: "Tipe responden tidak ditemukan"
            }
          ],
          data: null
        });
      }

      // Combine nama_depan and nama_belakang
      const namaLengkap = nama_belakang ? `${nama_depan} ${nama_belakang}` : nama_depan;

      // Insert feedback data diri
      const feedbackDataDiriId = await DB.from("feedback_data_diri").insert({
        account_id: userId,
        responden_id: responden_id,
        nama: namaLengkap,
        email: email,
        no_telp: no_telp,
        instansi: instansi || null,
        jabatan: jabatan || null,
        alamat: alamat || null,
        tanggal_feedback: dayjs().format('YYYY-MM-DD'),
        status_feedback: 'draft',
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      }).returning('id');

      const insertedId = Array.isArray(feedbackDataDiriId) 
        ? feedbackDataDiriId[0] 
        : feedbackDataDiriId;

      return response.status(201).json({
        statusCode: 201,
        message: "Data diri feedback berhasil dibuat",
        data: {
          feedback_data_diri_id: insertedId.toString()
        }
      });

    } catch (error) {
      console.error("Error in createFeedbackDataDiri:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Submit opinion rating (user responses)
   * POST /api/v1/user-responded/create
   */
  public async submitOpinionRating(request: Request, response: Response) {
    try {
      const {
        feedback_data_diri_id,
        responses // Array of {sub_responden_id, nilai_rating, komentar}
      } = request.body;

      // Validation
      if (!feedback_data_diri_id || !responses || !Array.isArray(responses) || responses.length === 0) {
        return response.status(422).json({
          statusCode: 422,
          message: "Data rating tidak lengkap",
          errors: [
            {
              rule: "required",
              field: "feedback_data_diri_id",
              message: "ID feedback data diri wajib diisi"
            },
            {
              rule: "required",
              field: "responses",
              message: "Rating responses wajib diisi"
            }
          ],
          data: null
        });
      }

      // Check if feedback_data_diri exists
      const feedbackDataDiri = await DB.from("feedback_data_diri")
        .where("id", feedback_data_diri_id)
        .first();

      if (!feedbackDataDiri) {
        return response.status(404).json({
          statusCode: 404,
          message: "Data feedback tidak ditemukan",
          data: null
        });
      }

      // Start transaction
      const trx = await DB.transaction();

      try {
        // Validate and insert each response
        for (const response_item of responses) {
          const { sub_responden_id, nilai_rating, komentar } = response_item;

          if (!sub_responden_id || nilai_rating === undefined) {
            await trx.rollback();
            return response.status(422).json({
              statusCode: 422,
              message: "Data rating tidak lengkap",
              errors: [
                {
                  rule: "required",
                  field: "sub_responden_id",
                  message: "ID sub responden wajib diisi"
                }
              ],
              data: null
            });
          }

          // Check if sub_responden exists and get rating range
          const subResponden = await trx.from("sub_responden")
            .where("id", sub_responden_id)
            .where("is_active", true)
            .first();

          if (!subResponden) {
            await trx.rollback();
            return response.status(422).json({
              statusCode: 422,
              message: "Pertanyaan tidak ditemukan",
              errors: [
                {
                  rule: "exists",
                  field: "sub_responden_id",
                  message: "Pertanyaan tidak ditemukan"
                }
              ],
              data: null
            });
          }

          // Validate rating range
          if (nilai_rating < subResponden.nilai_awal || nilai_rating > subResponden.nilai_akhir) {
            await trx.rollback();
            return response.status(422).json({
              statusCode: 422,
              message: `Rating harus antara ${subResponden.nilai_awal} dan ${subResponden.nilai_akhir}`,
              errors: [
                {
                  rule: "range",
                  field: "nilai_rating",
                  message: `Rating harus antara ${subResponden.nilai_awal} dan ${subResponden.nilai_akhir}`
                }
              ],
              data: null
            });
          }

          // Check for duplicate response
          const existingResponse = await trx.from("user_responded")
            .where("feedback_data_diri_id", feedback_data_diri_id)
            .where("sub_responden_id", sub_responden_id)
            .first();

          if (existingResponse) {
            // Update existing response
            await trx.from("user_responded")
              .where("id", existingResponse.id)
              .update({
                nilai_rating: nilai_rating,
                komentar: komentar || null,
                updated_at: dayjs().toDate()
              });
          } else {
            // Insert new response
            await trx.from("user_responded").insert({
              feedback_data_diri_id: feedback_data_diri_id,
              sub_responden_id: sub_responden_id,
              nilai_rating: nilai_rating,
              komentar: komentar || null,
              created_at: dayjs().toDate(),
              updated_at: dayjs().toDate()
            });
          }
        }

        // Update feedback status to submitted
        await trx.from("feedback_data_diri")
          .where("id", feedback_data_diri_id)
          .update({
            status_feedback: 'submitted',
            updated_at: dayjs().toDate()
          });

        await trx.commit();

        return response.status(200).json({
          statusCode: 200,
          message: "Rating berhasil disimpan",
          data: true
        });

      } catch (error) {
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      console.error("Error in submitOpinionRating:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Submit suggestion feedback (usul)
   * POST /api/v1/feedback-usul/create
   */
  public async submitSuggestionFeedback(request: Request, response: Response) {
    try {
      const {
        feedback_data_diri_id,
        kolaborasi_perlibatan,
        penjelasan_kegiatan,
        keluhan,
        saran,
        harapan_masa_depan,
        prioritas = 'sedang',
        kategori_usul = 'lainnya'
      } = request.body;

      // Validation
      if (!feedback_data_diri_id) {
        return response.status(422).json({
          statusCode: 422,
          message: "ID feedback data diri wajib diisi",
          errors: [
            {
              rule: "required",
              field: "feedback_data_diri_id",
              message: "ID feedback data diri wajib diisi"
            }
          ],
          data: null
        });
      }

      // Check if feedback_data_diri exists
      const feedbackDataDiri = await DB.from("feedback_data_diri")
        .where("id", feedback_data_diri_id)
        .first();

      if (!feedbackDataDiri) {
        return response.status(404).json({
          statusCode: 404,
          message: "Data feedback tidak ditemukan",
          data: null
        });
      }

      // Validate enum values
      const validPrioritas = ['rendah', 'sedang', 'tinggi', 'urgent'];
      const validKategori = ['fasilitas', 'layanan', 'event', 'infrastruktur', 'teknologi', 'kebijakan', 'lainnya'];

      if (!validPrioritas.includes(prioritas)) {
        return response.status(422).json({
          statusCode: 422,
          message: "Prioritas tidak valid",
          errors: [
            {
              rule: "enum",
              field: "prioritas",
              message: "Prioritas harus salah satu dari: " + validPrioritas.join(', ')
            }
          ],
          data: null
        });
      }

      if (!validKategori.includes(kategori_usul)) {
        return response.status(422).json({
          statusCode: 422,
          message: "Kategori usul tidak valid",
          errors: [
            {
              rule: "enum",
              field: "kategori_usul",
              message: "Kategori usul harus salah satu dari: " + validKategori.join(', ')
            }
          ],
          data: null
        });
      }

      // Insert feedback usul
      const usulId = await DB.from("feedback_usul").insert({
        feedback_data_diri_id: feedback_data_diri_id,
        kolaborasi_perlibatan: kolaborasi_perlibatan || null,
        penjelasan_kegiatan: penjelasan_kegiatan || null,
        keluhan: keluhan || null,
        saran: saran || null,
        harapan_masa_depan: harapan_masa_depan || null,
        prioritas: prioritas,
        kategori_usul: kategori_usul,
        status_review: 'pending',
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      }).returning('id');

      const insertedId = Array.isArray(usulId) ? usulId[0] : usulId;

      // Get the created record for response
      const createdUsul = await DB.from("feedback_usul")
        .where("id", insertedId)
        .first();

      return response.status(201).json({
        statusCode: 201,
        message: "Feedback usul berhasil disimpan",
        data: {
          id: createdUsul.id.toString(),
          feedback_data_diri_id: createdUsul.feedback_data_diri_id.toString(),
          kolaborasi_perlibatan: createdUsul.kolaborasi_perlibatan,
          penjelasan_kegiatan: createdUsul.penjelasan_kegiatan,
          keluhan: createdUsul.keluhan,
          saran: createdUsul.saran,
          account_id: feedbackDataDiri.account_id,
          created_at: dayjs(createdUsul.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updated_at: dayjs(createdUsul.updated_at).format('YYYY-MM-DD HH:mm:ss')
        }
      });

    } catch (error) {
      console.error("Error in submitSuggestionFeedback:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Submit room feedback (feedback lainnya)
   * POST /api/v1/feedback-lainnya/create/:idBooking?
   */
  public async submitRoomFeedback(request: Request, response: Response) {
    try {
      const { idBooking } = request.params;
      const {
        feedback_data_diri_id,
        prasarana_id,
        rating_fasilitas = 5,
        komentar_fasilitas,
        rating_kebersihan = 5,
        komentar_kebersihan,
        rating_pelayanan = 5,
        komentar_pelayanan,
        rating_keamanan = 5,
        komentar_keamanan,
        rating_akses = 5,
        komentar_akses,
        masalah_teknis,
        saran_perbaikan,
        akan_gunakan_lagi = true,
        alasan_tidak_gunakan,
        tingkat_kepentingan = 'penting'
      } = request.body;

      // Validation
      if (!feedback_data_diri_id) {
        return response.status(422).json({
          statusCode: 422,
          message: "ID feedback data diri wajib diisi",
          errors: [
            {
              rule: "required",
              field: "feedback_data_diri_id",
              message: "ID feedback data diri wajib diisi"
            }
          ],
          data: null
        });
      }

      // Check if feedback_data_diri exists
      const feedbackDataDiri = await DB.from("feedback_data_diri")
        .where("id", feedback_data_diri_id)
        .first();

      if (!feedbackDataDiri) {
        return response.status(404).json({
          statusCode: 404,
          message: "Data feedback tidak ditemukan",
          data: null
        });
      }

      // Validate booking if idBooking provided
      let bookingEventId = null;
      if (idBooking) {
        const booking = await DB.from("booking_events")
          .where("id", idBooking)
          .where("is_active", true)
          .first();

        if (!booking) {
          return response.status(404).json({
            statusCode: 404,
            message: "Booking event tidak ditemukan",
            data: null
          });
        }
        bookingEventId = idBooking;
      }

      // Validate prasarana if provided
      if (prasarana_id) {
        const prasarana = await DB.from("prasarana_mcc")
          .where("id", prasarana_id)
          .where("is_active", true)
          .first();

        if (!prasarana) {
          return response.status(422).json({
            statusCode: 422,
            message: "Prasarana tidak ditemukan",
            errors: [
              {
                rule: "exists",
                field: "prasarana_id",
                message: "Prasarana tidak ditemukan"
              }
            ],
            data: null
          });
        }
      }

      // Validate rating values (1-5)
      const ratings = {
        rating_fasilitas,
        rating_kebersihan,
        rating_pelayanan,
        rating_keamanan,
        rating_akses
      };

      for (const [field, value] of Object.entries(ratings)) {
        if (value < 1 || value > 5) {
          return response.status(422).json({
            statusCode: 422,
            message: `${field} harus antara 1 dan 5`,
            errors: [
              {
                rule: "range",
                field: field,
                message: `${field} harus antara 1 dan 5`
              }
            ],
            data: null
          });
        }
      }

      // Validate enum values
      const validTingkatKepentingan = ['tidak_penting', 'kurang_penting', 'penting', 'sangat_penting'];
      if (!validTingkatKepentingan.includes(tingkat_kepentingan)) {
        return response.status(422).json({
          statusCode: 422,
          message: "Tingkat kepentingan tidak valid",
          errors: [
            {
              rule: "enum",
              field: "tingkat_kepentingan",
              message: "Tingkat kepentingan harus salah satu dari: " + validTingkatKepentingan.join(', ')
            }
          ],
          data: null
        });
      }

      // Insert feedback lainnya
      await DB.from("feedback_lainnya").insert({
        feedback_data_diri_id: feedback_data_diri_id,
        booking_event_id: bookingEventId,
        prasarana_id: prasarana_id || null,
        rating_fasilitas: rating_fasilitas,
        komentar_fasilitas: komentar_fasilitas || null,
        rating_kebersihan: rating_kebersihan,
        komentar_kebersihan: komentar_kebersihan || null,
        rating_pelayanan: rating_pelayanan,
        komentar_pelayanan: komentar_pelayanan || null,
        rating_keamanan: rating_keamanan,
        komentar_keamanan: komentar_keamanan || null,
        rating_akses: rating_akses,
        komentar_akses: komentar_akses || null,
        masalah_teknis: masalah_teknis || null,
        saran_perbaikan: saran_perbaikan || null,
        akan_gunakan_lagi: akan_gunakan_lagi,
        alasan_tidak_gunakan: akan_gunakan_lagi ? null : alasan_tidak_gunakan,
        tingkat_kepentingan: tingkat_kepentingan,
        created_at: dayjs().toDate(),
        updated_at: dayjs().toDate()
      });

      return response.status(200).json({
        statusCode: 200,
        message: "Feedback ruangan berhasil disimpan",
        data: true
      });

    } catch (error) {
      console.error("Error in submitRoomFeedback:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Get opinion questions (responden and sub_responden)
   * GET /api/v1/responded/pertanyaan/pendapat
   */
  public async getOpinionQuestions(request: Request, response: Response) {
    try {
      const page = toNumber(request.query.page, 1);
      const limit = toNumber(request.query.limit, 50);
      const offset = (page - 1) * limit;

      // Get responden with their sub_responden questions
      const responden = await DB.from("responden as r")
        .leftJoin("sub_responden as sr", function() {
          this.on("r.id", "=", "sr.responden_id")
              .andOn("sr.is_active", "=", DB.raw("1"));
        })
        .where("r.is_active", true)
        .select(
          "r.id as responden_id",
          "r.tipe_responden",
          "sr.id as sub_responden_id",
          "sr.pertanyaan",
          "sr.nilai_awal",
          "sr.nilai_akhir",
          "sr.tipe_input",
          "sr.urutan"
        )
        .orderBy("r.id")
        .orderBy("sr.urutan");

      // Group by responden
      const groupedData = [];
      const respondenMap = new Map();

      responden.forEach(row => {
        if (!respondenMap.has(row.responden_id)) {
          respondenMap.set(row.responden_id, {
            id: row.responden_id.toString(),
            tipe_responden: row.tipe_responden,
            sub_responden: []
          });
        }

        const respondenData = respondenMap.get(row.responden_id);
        
        if (row.sub_responden_id) {
          respondenData.sub_responden.push({
            id: row.sub_responden_id.toString(),
            responden_id: row.responden_id.toString(),
            pertanyaan: row.pertanyaan,
            nilai_awal: row.nilai_awal,
            nilai_akhir: row.nilai_akhir
          });
        }
      });

      // Convert map to array
      respondenMap.forEach(respondenData => {
        groupedData.push(respondenData);
      });

      // Apply pagination
      const total = groupedData.length;
      const paginatedData = groupedData.slice(offset, offset + limit);

      // Calculate pagination
      const lastPage = Math.ceil(total / limit);
      const nextPage = page < lastPage ? page + 1 : null;
      const previousPage = page > 1 ? page - 1 : null;

      return response.status(200).json({
        statusCode: 200,
        message: "Data pertanyaan pendapat berhasil diambil",
        data: paginatedData,
        page: page,
        total: total,
        perPage: limit,
        lastPage: lastPage,
        nextPage: nextPage,
        previousPage: previousPage
      });

    } catch (error) {
      console.error("Error in getOpinionQuestions:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Delete feedback (placeholder - not implemented in frontend service)
   * DELETE /api/v1/feedback/:id
   */
  public async deleteFeedback(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!id) {
        return response.status(422).json({
          statusCode: 422,
          message: "ID feedback wajib diisi",
          errors: [
            {
              rule: "required",
              field: "id",
              message: "ID feedback wajib diisi"
            }
          ],
          data: null
        });
      }

      // Check if feedback exists and belongs to user
      const feedback = await DB.from("feedback_data_diri")
        .where("id", id)
        .where("account_id", userId)
        .first();

      if (!feedback) {
        return response.status(404).json({
          statusCode: 404,
          message: "Feedback tidak ditemukan atau tidak memiliki akses",
          data: null
        });
      }

      // Start transaction
      const trx = await DB.transaction();

      try {
        // Delete related records first (cascade will handle most, but for safety)
        await trx.from("user_responded")
          .where("feedback_data_diri_id", id)
          .del();

        await trx.from("feedback_usul")
          .where("feedback_data_diri_id", id)
          .del();

        await trx.from("feedback_lainnya")
          .where("feedback_data_diri_id", id)
          .del();

        // Delete main feedback record
        await trx.from("feedback_data_diri")
          .where("id", id)
          .del();

        await trx.commit();

        return response.status(200).json({
          statusCode: 200,
          message: "Feedback berhasil dihapus",
          data: true
        });

      } catch (error) {
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      console.error("Error in deleteFeedback:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }

  /**
   * Get feedback statistics (bonus endpoint for admin)
   * GET /api/v1/feedback/statistics
   */
  public async getFeedbackStatistics(request: Request, response: Response) {
    try {
      // Get rating statistics
      const ratingStats = await DB.from("rating_statistics")
        .select("*")
        .orderBy("avg_rating", "desc");

      // Get facility rating statistics
      const facilityStats = await DB.from("facility_rating_statistics")
        .select("*")
        .orderBy("avg_rating_overall", "desc");

      // Get monthly trends
      const monthlyTrends = await DB.from("monthly_feedback_trends")
        .select("*")
        .orderBy("month_year", "desc")
        .limit(12);

      // Get usul statistics
      const usulStats = await DB.from("usul_statistics")
        .select("*")
        .orderBy("total_usul", "desc");

      return response.status(200).json({
        statusCode: 200,
        message: "Statistik feedback berhasil diambil",
        data: {
          rating_statistics: ratingStats,
          facility_statistics: facilityStats,
          monthly_trends: monthlyTrends,
          usul_statistics: usulStats
        }
      });

    } catch (error) {
      console.error("Error in getFeedbackStatistics:", error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        data: null,
        errors: [error.message]
      });
    }
  }
}

export default new FeedbackApiController(); 