import DB from "../../services/DB";
import { Request, Response } from "../../../type";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

class BookingApiController {
  /**
   * Create new booking with multipart form data
   * POST /api/v1/booking/booking-ruangan
   */
  public async createBooking(request: Request, response: Response) {
    try {
      const userId = request.user.id;

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
      
      const fields = formData.fields;
      const files = formData.files;

      // Validation required fields
      if (!fields.nama_event || !fields.tipe_event || !fields.kategori_event_id || 
          !fields.nama_pic || !fields.no_telp_pic) {
        return response.status(422).json({
          statusCode: 422,
          message: "Data wajib tidak lengkap",
          errors: [
            {
              rule: "required",
              field: "nama_event",
              message: "Nama event wajib diisi"
            }
          ],
          data: null
        });
      }

      // Parse prasarana_bookings array
      const prasaranaBookings = [];
      let index = 0;
      while (fields[`prasarana_bookings[${index}][prasarana_mcc_id]`]) {
        const prasaranaBooking = {
          prasarana_mcc_id: parseInt(fields[`prasarana_bookings[${index}][prasarana_mcc_id]`]),
          tanggal_penggunaan: fields[`prasarana_bookings[${index}][tanggal_penggunaan]`],
          waktu_booking_id: []
        };

        // Parse waktu_booking_id array
        let waktuIndex = 0;
        while (fields[`prasarana_bookings[${index}][waktu_booking_id][${waktuIndex}]`]) {
          prasaranaBooking.waktu_booking_id.push(
            parseInt(fields[`prasarana_bookings[${index}][waktu_booking_id][${waktuIndex}]`])
          );
          waktuIndex++;
        }

        prasaranaBookings.push(prasaranaBooking);
        index++;
      }

      if (prasaranaBookings.length === 0) {
        return response.status(422).json({
          statusCode: 422,
          message: "Minimal harus memilih satu ruangan dan waktu",
          errors: [
            {
              rule: "required",
              field: "prasarana_bookings",
              message: "Minimal harus memilih satu ruangan dan waktu"
            }
          ],
          data: null
        });
      }

      // Check for booking conflicts
      for (const booking of prasaranaBookings) {
        for (const waktuId of booking.waktu_booking_id) {
          const conflict = await DB.from("booking_waktu as bw")
            .join("prasarana_bookings as pb", "bw.prasarana_booking_id", "pb.id")
            .join("booking_events as be", "pb.booking_event_id", "be.id")
            .where("pb.prasarana_mcc_id", booking.prasarana_mcc_id)
            .where("pb.tanggal_penggunaan", booking.tanggal_penggunaan)
            .where("bw.waktu_booking_id", waktuId)
            .where("be.status_persetujuan", "!=", "rejected")
            .where("pb.status", "active")
            .first();

          if (conflict) {
            return response.status(422).json({
              statusCode: 422,
              message: "Waktu yang dipilih sudah dibooking",
              errors: [
                {
                  rule: "conflict",
                  field: "waktu_booking",
                  message: "Waktu yang dipilih sudah dibooking oleh user lain"
                }
              ],
              data: null
            });
          }
        }
      }

      // Handle file uploads
      let bannerPath = null;
      let proposalPath = null;
      let ttdPath = null;

      if (files.banner_event) {
        const bannerFile = files.banner_event;
        const bannerFileName = `${Date.now()}_${bannerFile.filename}`;
        bannerPath = `uploads/banners/${bannerFileName}`;
        // TODO: Implement actual file saving logic
        // await bannerFile.save(bannerPath);
      }

      if (files.proposal_event) {
        const proposalFile = files.proposal_event;
        const proposalFileName = `${Date.now()}_${proposalFile.filename}`;
        proposalPath = `uploads/proposals/${proposalFileName}`;
        // TODO: Implement actual file saving logic
        // await proposalFile.save(proposalPath);
      }

      if (files.ttd) {
        const ttdFile = files.ttd;
        const ttdFileName = `${Date.now()}_${ttdFile.filename}`;
        ttdPath = `uploads/signatures/${ttdFileName}`;
        // TODO: Implement actual file saving logic
        // await ttdFile.save(ttdPath);
      }

      // Start transaction
      const trx = await DB.transaction();

      try {
        // Create booking event
        const bookingEventId = randomUUID();
        await trx("booking_events").insert({
          id: bookingEventId,
          account_id: userId,
          kode_booking: '', // Will be auto-generated by trigger
          nama_event: fields.nama_event,
          kategori_event_id: parseInt(fields.kategori_event_id),
          ekraf_id: fields.ekraf_id ? parseInt(fields.ekraf_id) : null,
          sdgs_id: fields.sdgs_id ? parseInt(fields.sdgs_id) : null,
          tipe_event: fields.tipe_event,
          deskripsi: fields.deskripsi || null,
          estimasi_peserta: fields.estimasi_peserta ? parseInt(fields.estimasi_peserta) : null,
          nama_pic: fields.nama_pic,
          no_telp_pic: fields.no_telp_pic,
          jenis_event: fields.jenis_event || null,
          status_persetujuan: 'pending',
          banner_event: bannerPath,
          proposal_event: proposalPath,
          ttd: ttdPath,
          detail_peralatan: fields.detail_peralatan || null,
          created_at: dayjs().toDate(),
          updated_at: dayjs().toDate()
        });

        // Create prasarana bookings
        for (const booking of prasaranaBookings) {
          const prasaranaBookingId = await trx("prasarana_bookings").insert({
            booking_event_id: bookingEventId,
            prasarana_mcc_id: booking.prasarana_mcc_id,
            tanggal_penggunaan: booking.tanggal_penggunaan,
            status: 'active',
            created_at: dayjs().toDate(),
            updated_at: dayjs().toDate()
          }).returning('id');

          const prasaranaBookingIdValue = Array.isArray(prasaranaBookingId) 
            ? prasaranaBookingId[0] 
            : prasaranaBookingId;

          // Create booking waktu entries
          for (const waktuId of booking.waktu_booking_id) {
            await trx("booking_waktu").insert({
              prasarana_booking_id: prasaranaBookingIdValue,
              waktu_booking_id: waktuId,
              created_at: dayjs().toDate(),
              updated_at: dayjs().toDate()
            });
          }
        }

        // Get the generated booking code
        const createdBooking = await trx("booking_events")
          .where("id", bookingEventId)
          .select("kode_booking")
          .first();

        await trx.commit();

        return response.status(201).json({
          statusCode: 201,
          message: "Booking berhasil dibuat",
          data: {
            booking_id: bookingEventId,
            kode_booking: createdBooking?.kode_booking,
            status: "pending"
          }
        });

      } catch (error) {
        await trx.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create booking error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get user bookings with pagination and filtering
   * GET /api/v1/booking/event/user
   */
  public async getUserBookings(request: Request, response: Response) {
    try {
      const userId = request.user.id;
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 4;
      const status = request.query.status as string || "Semua";
      const offset = (page - 1) * limit;

      // Build query
      let query = DB.from("booking_events as be")
        .where("be.account_id", userId)
        .where("be.is_active", true);

      // Apply status filter
      if (status !== "Semua") {
        query = query.where("be.status_persetujuan", status.toLowerCase());
      }

      // Get total count
      const totalResult = await query.clone().count("* as total").first();
      const total = totalResult?.total || 0;
      const lastPage = Math.ceil(total / limit);

      // Get bookings with details
      const bookings = await query
        .select([
          "be.id",
          "be.kode_booking",
          "be.nama_event",
          "be.jenis_event",
          "be.status_persetujuan",
          "be.created_at"
        ])
        .orderBy("be.created_at", "desc")
        .limit(limit)
        .offset(offset);

      // Get booking details for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          // Get prasarana bookings
          const prasaranaBookings = await DB.from("prasarana_bookings as pb")
            .join("prasarana_mcc as p", "pb.prasarana_mcc_id", "p.id")
            .where("pb.booking_event_id", booking.id)
            .where("pb.status", "active")
            .select([
              "pb.tanggal_penggunaan",
              "p.nama_prasarana"
            ])
            .orderBy("pb.tanggal_penggunaan", "asc");

          // Group by date and create ruangEvent structure
          const ruangEventMap = new Map();
          prasaranaBookings.forEach(pb => {
            const date = pb.tanggal_penggunaan;
            if (!ruangEventMap.has(date)) {
              ruangEventMap.set(date, {
                tanggal_event: date,
                prefix_event: []
              });
            }
            ruangEventMap.get(date).prefix_event.push(pb.nama_prasarana);
          });

          const ruangEvent = Array.from(ruangEventMap.values()).map(item => ({
            tanggal_event: item.tanggal_event,
            prefix_event: item.prefix_event.join(", ")
          }));

          // Check if event spans multiple days
          const isEventManyDays = ruangEvent.length > 1;

          // Check if user has filled feedback (placeholder logic)
          const isSudahMengisiFeedback = false; // TODO: Implement feedback check
          const isPertamaKaliFeedback = true; // TODO: Implement feedback check

          return {
            id: booking.id,
            kode_booking: booking.kode_booking,
            nama_event: booking.nama_event,
            jenis_event: booking.jenis_event,
            status_persetujuan: booking.status_persetujuan,
            is_attemp_admin: false, // TODO: Implement admin attempt logic
            created_at: booking.created_at,
            result_detail_event: ruangEvent,
            is_event_many_days: isEventManyDays,
            is_sudah_mengisi_feedback: isSudahMengisiFeedback,
            is_pertama_kali_feedback: isPertamaKaliFeedback
          };
        })
      );

      const nextPage = page < lastPage ? page + 1 : null;
      const previousPage = page > 1 ? page - 1 : null;

      return response.status(200).json({
        statusCode: 200,
        message: "Data booking user berhasil diambil",
        data: bookingsWithDetails,
        page,
        total,
        perPage: limit,
        lastPage,
        nextPage,
        previousPage
      });

    } catch (error) {
      console.error('Get user bookings error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get jadwal availability for specific prasarana and date
   * GET /api/v1/booking/jadwal/:prasarana_id/:tanggal
   */
  public async getJadwalAvailability(request: Request, response: Response) {
    try {
      const prasaranaId = request.params.prasarana_id;
      const tanggal = request.params.tanggal;
      const userId = request.user.id;

      // Validate prasarana exists
      const prasarana = await DB.from("prasarana_mcc")
        .where("id", prasaranaId)
        .where("is_active", true)
        .where("is_bookable", true)
        .first();

      if (!prasarana) {
        return response.status(404).json({
          statusCode: 404,
          message: "Prasarana tidak ditemukan",
          errors: ["Prasarana tidak ditemukan atau tidak dapat dibooking"],
          data: null
        });
      }

      // Get all available time slots
      const allTimeSlots = await DB.from("waktu_booking")
        .where("is_active", true)
        .orderBy("waktu_mulai", "asc")
        .select([
          "id",
          "waktu_mulai",
          "waktu_selesai",
          "nama_slot"
        ]);

      // Get booked time slots for this prasarana and date
      const bookedSlots = await DB.from("booking_waktu as bw")
        .join("prasarana_bookings as pb", "bw.prasarana_booking_id", "pb.id")
        .join("booking_events as be", "pb.booking_event_id", "be.id")
        .where("pb.prasarana_mcc_id", prasaranaId)
        .where("pb.tanggal_penggunaan", tanggal)
        .where("be.status_persetujuan", "!=", "rejected")
        .where("pb.status", "active")
        .select([
          "bw.waktu_booking_id",
          "be.account_id"
        ]);

      const bookedSlotIds = bookedSlots.map(slot => slot.waktu_booking_id);
      const userBookedSlots = bookedSlots
        .filter(slot => slot.account_id === userId)
        .map(slot => slot.waktu_booking_id);

      // Format response
      const jadwalData = allTimeSlots.map(slot => ({
        id: slot.id.toString(),
        waktu_mulai: slot.waktu_mulai,
        waktu_selesai: slot.waktu_selesai,
        is_available: !bookedSlotIds.includes(slot.id),
        is_request_dia: userBookedSlots.includes(slot.id),
        request_status: userBookedSlots.includes(slot.id) ? "pending" : null
      }));

      return response.status(200).json({
        statusCode: 200,
        message: "Jadwal availability berhasil diambil",
        data: jadwalData
      });

    } catch (error) {
      console.error('Get jadwal availability error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get booking status for specific date range
   * GET /api/v1/booking/status
   */
  public async getBookingStatus(request: Request, response: Response) {
    try {
      const userId = request.user.id;
      const startDate = request.query.start_date as string;
      const endDate = request.query.end_date as string;
      const page = parseInt(request.query.page as string) || 1;
      const perPage = parseInt(request.query.per_page as string) || 10;
      const offset = (page - 1) * perPage;

      let query = DB.from("prasarana_bookings as pb")
        .join("booking_events as be", "pb.booking_event_id", "be.id")
        .where("be.account_id", userId)
        .where("pb.status", "active");

      // Apply date filters if provided
      if (startDate) {
        query = query.where("pb.tanggal_penggunaan", ">=", startDate);
      }
      if (endDate) {
        query = query.where("pb.tanggal_penggunaan", "<=", endDate);
      }

      // Get total count
      const totalResult = await query.clone().count("* as total").first();
      const total = totalResult?.total || 0;
      const lastPage = Math.ceil(total / perPage);

      // Get booking status data
      const bookingStatus = await query
        .select([
          "pb.tanggal_penggunaan",
          DB.raw("COUNT(DISTINCT bw.waktu_booking_id) as jumlah_waktu_booking"),
          "be.nama_event as keterangan"
        ])
        .leftJoin("booking_waktu as bw", "pb.id", "bw.prasarana_booking_id")
        .groupBy("pb.tanggal_penggunaan", "be.nama_event")
        .orderBy("pb.tanggal_penggunaan", "desc")
        .limit(perPage)
        .offset(offset);

      const nextPage = page < lastPage ? page + 1 : null;
      const previousPage = page > 1 ? page - 1 : null;

      return response.status(200).json({
        statusCode: 200,
        message: "Status booking berhasil diambil",
        data: bookingStatus,
        page,
        total,
        perPage,
        lastPage,
        nextPage,
        previousPage
      });

    } catch (error) {
      console.error('Get booking status error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get detailed booking information
   * GET /api/v1/booking/:booking_id/detail
   */
  public async getBookingDetail(request: Request, response: Response) {
    try {
      const bookingId = request.params.booking_id;
      const userId = request.user.id;

      // Get booking event details
      const booking = await DB.from("booking_events as be")
        .leftJoin("kategori_event as ke", "be.kategori_event_id", "ke.id")
        .leftJoin("ekraf as e", "be.ekraf_id", "e.id")
        .leftJoin("sdgs as s", "be.sdgs_id", "s.id")
        .where("be.id", bookingId)
        .where("be.account_id", userId)
        .select([
          "be.*",
          "ke.nama as kategori_event_nama",
          "e.nama as ekraf_nama",
          "s.nama as sdgs_nama"
        ])
        .first();

      if (!booking) {
        return response.status(404).json({
          statusCode: 404,
          message: "Booking tidak ditemukan",
          errors: ["Booking tidak ditemukan"],
          data: null
        });
      }

      // Get prasarana bookings with details
      const prasaranaBookings = await DB.from("prasarana_bookings as pb")
        .join("prasarana_mcc as p", "pb.prasarana_mcc_id", "p.id")
        .join("infrastruktur_mcc as i", "p.infrastruktur_mcc_id", "i.id")
        .where("pb.booking_event_id", bookingId)
        .where("pb.status", "active")
        .select([
          "pb.id as prasarana_booking_id",
          "pb.tanggal_penggunaan",
          "p.nama_prasarana",
          "p.kapasitas",
          "p.biaya_sewa",
          "i.nama_infrastruktur"
        ]);

      // Get time slots for each prasarana booking
      const prasaranaWithTimeSlots = await Promise.all(
        prasaranaBookings.map(async (prasarana) => {
          const timeSlots = await DB.from("booking_waktu as bw")
            .join("waktu_booking as wb", "bw.waktu_booking_id", "wb.id")
            .where("bw.prasarana_booking_id", prasarana.prasarana_booking_id)
            .select([
              "wb.waktu_mulai",
              "wb.waktu_selesai",
              "wb.nama_slot"
            ])
            .orderBy("wb.waktu_mulai", "asc");

          return {
            ...prasarana,
            time_slots: timeSlots
          };
        })
      );

      // Format complete booking detail
      const bookingDetail = {
        id: booking.id,
        kode_booking: booking.kode_booking,
        nama_event: booking.nama_event,
        kategori_event: {
          id: booking.kategori_event_id,
          nama: booking.kategori_event_nama
        },
        ekraf: booking.ekraf_id ? {
          id: booking.ekraf_id,
          nama: booking.ekraf_nama
        } : null,
        sdgs: booking.sdgs_id ? {
          id: booking.sdgs_id,
          nama: booking.sdgs_nama
        } : null,
        tipe_event: booking.tipe_event,
        deskripsi: booking.deskripsi,
        estimasi_peserta: booking.estimasi_peserta,
        nama_pic: booking.nama_pic,
        no_telp_pic: booking.no_telp_pic,
        jenis_event: booking.jenis_event,
        status_persetujuan: booking.status_persetujuan,
        banner_event: booking.banner_event,
        proposal_event: booking.proposal_event,
        ttd: booking.ttd,
        detail_peralatan: booking.detail_peralatan,
        prasarana_bookings: prasaranaWithTimeSlots,
        created_at: booking.created_at,
        updated_at: booking.updated_at
      };

      return response.status(200).json({
        statusCode: 200,
        message: "Detail booking berhasil diambil",
        data: bookingDetail
      });

    } catch (error) {
      console.error('Get booking detail error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }
}

export default new BookingApiController(); 