"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class BookingApiController {
    async createBooking(request, response) {
        try {
            const userId = request.user.id;
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
            const fields = formData.fields;
            const files = formData.files;
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
            const prasaranaBookings = [];
            let index = 0;
            while (fields[`prasarana_bookings[${index}][prasarana_mcc_id]`]) {
                const prasaranaBooking = {
                    prasarana_mcc_id: parseInt(fields[`prasarana_bookings[${index}][prasarana_mcc_id]`]),
                    tanggal_penggunaan: fields[`prasarana_bookings[${index}][tanggal_penggunaan]`],
                    waktu_booking_id: []
                };
                let waktuIndex = 0;
                while (fields[`prasarana_bookings[${index}][waktu_booking_id][${waktuIndex}]`]) {
                    prasaranaBooking.waktu_booking_id.push(parseInt(fields[`prasarana_bookings[${index}][waktu_booking_id][${waktuIndex}]`]));
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
            for (const booking of prasaranaBookings) {
                for (const waktuId of booking.waktu_booking_id) {
                    const conflict = await DB_1.default.from("booking_waktu as bw")
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
            let bannerPath = null;
            let proposalPath = null;
            let ttdPath = null;
            if (files.banner_event) {
                const bannerFile = files.banner_event;
                const bannerFileName = `${Date.now()}_${bannerFile.filename}`;
                bannerPath = `uploads/banners/${bannerFileName}`;
            }
            if (files.proposal_event) {
                const proposalFile = files.proposal_event;
                const proposalFileName = `${Date.now()}_${proposalFile.filename}`;
                proposalPath = `uploads/proposals/${proposalFileName}`;
            }
            if (files.ttd) {
                const ttdFile = files.ttd;
                const ttdFileName = `${Date.now()}_${ttdFile.filename}`;
                ttdPath = `uploads/signatures/${ttdFileName}`;
            }
            const trx = await DB_1.default.transaction();
            try {
                const bookingEventId = (0, crypto_1.randomUUID)();
                await trx("booking_events").insert({
                    id: bookingEventId,
                    account_id: userId,
                    kode_booking: '',
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
                    created_at: (0, dayjs_1.default)().toDate(),
                    updated_at: (0, dayjs_1.default)().toDate()
                });
                for (const booking of prasaranaBookings) {
                    const prasaranaBookingIdRaw = await trx("prasarana_bookings")
                        .insert({
                        booking_event_id: bookingEventId,
                        prasarana_mcc_id: booking.prasarana_mcc_id,
                        tanggal_penggunaan: booking.tanggal_penggunaan,
                        status: 'active',
                        created_at: (0, dayjs_1.default)().toDate(),
                        updated_at: (0, dayjs_1.default)().toDate()
                    })
                        .returning('id');
                    let prasaranaBookingIdValue;
                    if (Array.isArray(prasaranaBookingIdRaw)) {
                        const first = prasaranaBookingIdRaw[0];
                        prasaranaBookingIdValue = typeof first === 'object' ? first.id : first;
                    }
                    else if (typeof prasaranaBookingIdRaw === 'object') {
                        prasaranaBookingIdValue = prasaranaBookingIdRaw.id;
                    }
                    else {
                        prasaranaBookingIdValue = prasaranaBookingIdRaw;
                    }
                    for (const waktuId of booking.waktu_booking_id) {
                        await trx("booking_waktu").insert({
                            prasarana_booking_id: prasaranaBookingIdValue,
                            waktu_booking_id: waktuId,
                            created_at: (0, dayjs_1.default)().toDate(),
                            updated_at: (0, dayjs_1.default)().toDate()
                        });
                    }
                }
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
            }
            catch (error) {
                await trx.rollback();
                throw error;
            }
        }
        catch (error) {
            console.error('Create booking error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getUserBookings(request, response) {
        try {
            const userId = request.user.id;
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 4;
            const status = request.query.status || "Semua";
            const offset = (page - 1) * limit;
            let query = DB_1.default.from("booking_events as be")
                .where("be.account_id", userId)
                .where("be.is_active", true);
            if (status !== "Semua") {
                query = query.where("be.status_persetujuan", status.toLowerCase());
            }
            const totalResult = await query.clone().count("* as total").first();
            const total = totalResult?.total || 0;
            const lastPage = Math.ceil(total / limit);
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
            const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
                const prasaranaBookings = await DB_1.default.from("prasarana_bookings as pb")
                    .join("prasarana_mcc as p", "pb.prasarana_mcc_id", "p.id")
                    .where("pb.booking_event_id", booking.id)
                    .where("pb.status", "active")
                    .select([
                    "pb.tanggal_penggunaan",
                    "p.nama_prasarana"
                ])
                    .orderBy("pb.tanggal_penggunaan", "asc");
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
                const isEventManyDays = ruangEvent.length > 1;
                const isSudahMengisiFeedback = false;
                const isPertamaKaliFeedback = true;
                return {
                    id: booking.id,
                    kode_booking: booking.kode_booking,
                    nama_event: booking.nama_event,
                    jenis_event: booking.jenis_event,
                    status_persetujuan: booking.status_persetujuan,
                    is_attemp_admin: false,
                    created_at: booking.created_at,
                    result_detail_event: ruangEvent,
                    is_event_many_days: isEventManyDays,
                    is_sudah_mengisi_feedback: isSudahMengisiFeedback,
                    is_pertama_kali_feedback: isPertamaKaliFeedback
                };
            }));
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
        }
        catch (error) {
            console.error('Get user bookings error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getJadwalAvailability(request, response) {
        try {
            const prasaranaId = request.params.prasarana_id;
            const tanggal = request.params.tanggal;
            const userId = request.user ? request.user.id : null;
            const prasarana = await DB_1.default.from("prasarana_mcc")
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
            const allTimeSlots = await DB_1.default.from("waktu_booking")
                .where("is_active", true)
                .orderBy("waktu_mulai", "asc")
                .select([
                "id",
                "waktu_mulai",
                "waktu_selesai"
            ]);
            const bookedSlots = await DB_1.default.from("booking_waktu as bw")
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
            const userBookedSlots = userId
                ? bookedSlots.filter(slot => slot.account_id === userId).map(slot => slot.waktu_booking_id)
                : [];
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
        }
        catch (error) {
            console.error('Get jadwal availability error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getBookingStatus(request, response) {
        try {
            const userId = request.user.id;
            const startDate = request.query.start_date;
            const endDate = request.query.end_date;
            const page = parseInt(request.query.page) || 1;
            const perPage = parseInt(request.query.per_page) || 10;
            const offset = (page - 1) * perPage;
            let query = DB_1.default.from("prasarana_bookings as pb")
                .join("booking_events as be", "pb.booking_event_id", "be.id")
                .where("be.account_id", userId)
                .where("pb.status", "active");
            if (startDate) {
                query = query.where("pb.tanggal_penggunaan", ">=", startDate);
            }
            if (endDate) {
                query = query.where("pb.tanggal_penggunaan", "<=", endDate);
            }
            const totalResult = await query.clone().count("* as total").first();
            const total = totalResult?.total || 0;
            const lastPage = Math.ceil(total / perPage);
            const bookingStatus = await query
                .select([
                "pb.tanggal_penggunaan",
                DB_1.default.raw("COUNT(DISTINCT bw.waktu_booking_id) as jumlah_waktu_booking"),
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
        }
        catch (error) {
            console.error('Get booking status error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getBookingDetail(request, response) {
        try {
            const bookingId = request.params.booking_id;
            const userId = request.user.id;
            const booking = await DB_1.default.from("booking_events as be")
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
            const prasaranaBookings = await DB_1.default.from("prasarana_bookings as pb")
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
            const prasaranaWithTimeSlots = await Promise.all(prasaranaBookings.map(async (prasarana) => {
                const timeSlots = await DB_1.default.from("booking_waktu as bw")
                    .join("waktu_booking as wb", "bw.waktu_booking_id", "wb.id")
                    .where("bw.prasarana_booking_id", prasarana.prasarana_booking_id)
                    .select([
                    "wb.waktu_mulai",
                    "wb.waktu_selesai"
                ])
                    .orderBy("wb.waktu_mulai", "asc");
                return {
                    ...prasarana,
                    time_slots: timeSlots
                };
            }));
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
        }
        catch (error) {
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
exports.default = new BookingApiController();
//# sourceMappingURL=BookingApiController.js.map