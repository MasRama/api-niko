"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
const toNumber = (value, defaultVal = 0) => {
    if (Array.isArray(value))
        value = value[0];
    const n = parseInt(String(value));
    return isNaN(n) ? defaultVal : n;
};
const toStringParam = (value, defaultVal = "") => {
    if (Array.isArray(value))
        value = value[0];
    return value !== undefined && value !== null ? String(value) : defaultVal;
};
class EventApiController {
    async getAllEvents(request, response) {
        try {
            const { kategori_event_id, kategori_ekraf_id, ruang_id, tanggal, status_event, page = 1, limit = 10 } = request.query;
            const offset = (toNumber(page) - 1) * toNumber(limit);
            let query = DB_1.default.from("booking_events as be")
                .leftJoin("users as u", "be.account_id", "u.id")
                .leftJoin("instansi_users as iu", "be.account_id", "iu.user_id")
                .leftJoin("kategori_event as ke", "be.kategori_event_id", "ke.id")
                .leftJoin("ekraf as e", "be.ekraf_id", "e.id")
                .leftJoin("prasarana_bookings as pb", "be.id", "pb.booking_event_id")
                .leftJoin("prasarana_mcc as pm", "pb.prasarana_mcc_id", "pm.id")
                .where("be.is_active", true)
                .where("be.status_persetujuan", "approved");
            if (kategori_event_id) {
                query = query.where("be.kategori_event_id", kategori_event_id);
            }
            if (kategori_ekraf_id) {
                query = query.where("be.ekraf_id", kategori_ekraf_id);
            }
            if (ruang_id) {
                query = query.where("pm.id", ruang_id);
            }
            if (tanggal) {
                const dateFormatted = this.convertDateFormat(toStringParam(tanggal));
                query = query.where("pb.tanggal_penggunaan", dateFormatted);
            }
            if (status_event) {
                query = query.where("be.jenis_event", status_event);
            }
            const countQuery = query.clone().countDistinct("be.id as total");
            const totalResult = await countQuery.first();
            const total = parseInt(totalResult?.total || 0);
            const events = await query
                .select("be.id", "be.kategori_event_id", "be.nama_event", "be.jenis_event", "be.banner_event", "be.account_id", "be.ekraf_id", "pb.tanggal_penggunaan as tanggal_query", DB_1.default.raw("CASE WHEN iu.nama_instansi IS NOT NULL THEN json_object('nama', iu.nama_instansi, 'id', iu.user_id) ELSE NULL END as accountInstansi"), DB_1.default.raw("json_object('nama', u.name, 'id', u.id) as account"))
                .groupBy("be.id", "be.kategori_event_id", "be.nama_event", "be.jenis_event", "be.banner_event", "be.account_id", "be.ekraf_id", "pb.tanggal_penggunaan", "u.name", "u.id", "iu.nama_instansi", "iu.user_id")
                .orderBy("be.created_at", "desc")
                .limit(toNumber(limit))
                .offset(offset);
            const formattedEvents = events.map(event => ({
                id: event.id,
                kategori_event_id: event.kategori_event_id?.toString() || "",
                nama_event: event.nama_event,
                jenis_event: event.jenis_event,
                banner_event: event.banner_event,
                account_id: event.account_id,
                account_instansi_personal_id: null,
                ekraf_id: event.ekraf_id?.toString() || "",
                tanggal_query: event.tanggal_query,
                account: typeof event.account === 'string' ? JSON.parse(event.account) : event.account,
                accountInstansi: event.accountInstansi ?
                    (typeof event.accountInstansi === 'string' ? JSON.parse(event.accountInstansi) : event.accountInstansi)
                    : null
            }));
            const lastPage = Math.ceil(total / toNumber(limit));
            const nextPage = toNumber(page) < lastPage ? toNumber(page) + 1 : null;
            const previousPage = toNumber(page) > 1 ? toNumber(page) - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data event berhasil diambil",
                data: formattedEvents,
                page: toNumber(page),
                total: total,
                perPage: toNumber(limit),
                lastPage: lastPage,
                nextPage: nextPage,
                previousPage: previousPage
            });
        }
        catch (error) {
            console.error("Error in getAllEvents:", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                data: null,
                errors: [error.message]
            });
        }
    }
    async getEventDetail(request, response) {
        try {
            const { eventId, date } = request.params;
            if (!eventId || !date) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Event ID dan tanggal wajib diisi",
                    data: null,
                    errors: [
                        {
                            rule: "required",
                            field: "eventId",
                            message: "Event ID wajib diisi"
                        }
                    ]
                });
            }
            const booking = await DB_1.default.from("booking_events as be")
                .leftJoin("kategori_event as ke", "be.kategori_event_id", "ke.id")
                .leftJoin("ekraf as e", "be.ekraf_id", "e.id")
                .where("be.id", eventId)
                .where("be.is_active", true)
                .select("be.id", "be.kategori_event_id", "be.ekraf_id", "be.nama_event", "be.deskripsi", "be.jenis_event", "be.banner_event", "be.estimasi_peserta", "be.nama_pic", "be.no_telp_pic", "ke.nama_kategori", "e.nama_ekraf")
                .first();
            if (!booking) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "Event tidak ditemukan",
                    data: null
                });
            }
            const roomData = await DB_1.default.from("prasarana_bookings as pb")
                .join("prasarana_mcc as pm", "pb.prasarana_mcc_id", "pm.id")
                .join("infrastruktur_mcc as im", "pm.infrastruktur_mcc_id", "im.id")
                .leftJoin("booking_waktu as bw", "pb.id", "bw.prasarana_booking_id")
                .leftJoin("waktu_booking as wb", "bw.waktu_booking_id", "wb.id")
                .where("pb.booking_event_id", eventId)
                .where("pb.tanggal_penggunaan", date)
                .where("pb.status", "active")
                .select("im.lantai", "im.id as infrastruktur_mcc_id", "pm.id as prasarana_mcc_id", "pm.nama_prasarana", "pb.tanggal_penggunaan", "wb.id as waktu_id", "wb.waktu_mulai", "wb.waktu_selesai")
                .orderBy("im.lantai")
                .orderBy("pm.nama_prasarana")
                .orderBy("wb.waktu_mulai");
            const groupedRoomData = [];
            const floorMap = new Map();
            roomData.forEach(row => {
                if (!floorMap.has(row.lantai)) {
                    floorMap.set(row.lantai, {
                        lantai: row.lantai,
                        infrastruktur_mcc_id: row.infrastruktur_mcc_id,
                        ruangan: new Map()
                    });
                }
                const floor = floorMap.get(row.lantai);
                if (!floor.ruangan.has(row.prasarana_mcc_id)) {
                    floor.ruangan.set(row.prasarana_mcc_id, {
                        prasarana_mcc_id: row.prasarana_mcc_id.toString(),
                        nama_prasarana: row.nama_prasarana,
                        waktu_booking: []
                    });
                }
                const room = floor.ruangan.get(row.prasarana_mcc_id);
                let dateEntry = room.waktu_booking.find(wb => wb.tanggal_penggunaan === row.tanggal_penggunaan);
                if (!dateEntry) {
                    dateEntry = {
                        tanggal_penggunaan: row.tanggal_penggunaan,
                        waktu: []
                    };
                    room.waktu_booking.push(dateEntry);
                }
                if (row.waktu_id) {
                    dateEntry.waktu.push({
                        waktu_mulai: row.waktu_mulai,
                        waktu_selesai: row.waktu_selesai,
                        id: row.waktu_id.toString()
                    });
                }
            });
            floorMap.forEach(floor => {
                const ruanganArray = Array.from(floor.ruangan.values());
                groupedRoomData.push({
                    lantai: floor.lantai,
                    infrastruktur_mcc_id: floor.infrastruktur_mcc_id.toString(),
                    ruangan: ruanganArray
                });
            });
            const prasaranaIds = roomData.map(row => row.prasarana_mcc_id.toString()).filter((id, index, arr) => arr.indexOf(id) === index);
            const responseData = {
                data_booking: {
                    id: booking.id,
                    kategori_event_id: booking.kategori_event_id?.toString() || "",
                    ekraf_id: booking.ekraf_id?.toString() || "",
                    nama_event: booking.nama_event,
                    deskripsi: booking.deskripsi || "",
                    jenis_event: booking.jenis_event || "",
                    banner_event: booking.banner_event,
                    estimasi_peserta: booking.estimasi_peserta || 0,
                    nama_pic: booking.nama_pic,
                    no_telp_pic: booking.no_telp_pic,
                    kategoriEvent: {
                        nama_kategori: booking.nama_kategori || "",
                        id: booking.kategori_event_id?.toString() || ""
                    },
                    ekraf: {
                        nama: booking.nama_ekraf || "",
                        id: booking.ekraf_id?.toString() || ""
                    }
                },
                data_ruang_event: groupedRoomData,
                data_id_prasarana: prasaranaIds.join(",")
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Detail event berhasil diambil",
                data: responseData
            });
        }
        catch (error) {
            console.error("Error in getEventDetail:", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                data: null,
                errors: [error.message]
            });
        }
    }
    async getKategoriEvent(request, response) {
        try {
            const { fields, page = 1, limit = 50 } = request.query;
            const offset = (toNumber(page) - 1) * toNumber(limit);
            let query = DB_1.default.from("kategori_event")
                .where("is_active", true)
                .orderBy("nama_kategori");
            if (fields) {
                const selectedFields = toStringParam(fields).split(',').map(field => field.trim());
                query = query.select(selectedFields);
            }
            else {
                query = query.select("id", "nama_kategori");
            }
            const totalResult = await DB_1.default.from("kategori_event")
                .where("is_active", true)
                .count("id as total")
                .first();
            const total = parseInt(totalResult?.total || 0);
            const kategoriEvent = await query
                .limit(toNumber(limit))
                .offset(offset);
            const lastPage = Math.ceil(total / toNumber(limit));
            const nextPage = toNumber(page) < lastPage ? toNumber(page) + 1 : null;
            const previousPage = toNumber(page) > 1 ? toNumber(page) - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data kategori event berhasil diambil",
                data: kategoriEvent,
                page: toNumber(page),
                total: total,
                perPage: toNumber(limit),
                lastPage: lastPage,
                nextPage: nextPage,
                previousPage: previousPage
            });
        }
        catch (error) {
            console.error("Error in getKategoriEvent:", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                data: null,
                errors: [error.message]
            });
        }
    }
    async getEkrafCategories(request, response) {
        try {
            const { fields, page = 1, limit = 50 } = request.query;
            const offset = (toNumber(page) - 1) * toNumber(limit);
            let query = DB_1.default.from("ekraf")
                .where("is_active", true)
                .orderBy("nama_ekraf");
            if (fields) {
                const selectedFields = toStringParam(fields).split(',').map(field => field.trim());
                const mappedFields = selectedFields.map(field => field === 'nama' ? 'nama_ekraf' : field);
                query = query.select(mappedFields);
            }
            else {
                query = query.select("id", "nama_ekraf as nama");
            }
            const totalResult = await DB_1.default.from("ekraf")
                .where("is_active", true)
                .count("id as total")
                .first();
            const total = parseInt(totalResult?.total || 0);
            const ekrafCategories = await query
                .limit(toNumber(limit))
                .offset(offset);
            const formattedData = ekrafCategories.map(item => ({
                id: item.id,
                nama: item.nama_ekraf || item.nama
            }));
            const lastPage = Math.ceil(total / toNumber(limit));
            const nextPage = toNumber(page) < lastPage ? toNumber(page) + 1 : null;
            const previousPage = toNumber(page) > 1 ? toNumber(page) - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data kategori EKRAF berhasil diambil",
                data: formattedData,
                page: toNumber(page),
                total: total,
                perPage: toNumber(limit),
                lastPage: lastPage,
                nextPage: nextPage,
                previousPage: previousPage
            });
        }
        catch (error) {
            console.error("Error in getEkrafCategories:", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                data: null,
                errors: [error.message]
            });
        }
    }
    async getPrasaranaList(request, response) {
        try {
            const { fields, page = 1, limit = 50 } = request.query;
            const offset = (toNumber(page) - 1) * toNumber(limit);
            let query = DB_1.default.from("prasarana_mcc as pm")
                .leftJoin("infrastruktur_mcc as im", "pm.infrastruktur_mcc_id", "im.id")
                .where("pm.is_active", true)
                .where("pm.is_bookable", true)
                .orderBy("im.lantai")
                .orderBy("pm.nama_prasarana");
            if (fields) {
                const selectedFields = toStringParam(fields).split(',').map(field => field.trim());
                const mappedFields = selectedFields.map(field => {
                    if (field === 'nama_prasarana')
                        return 'pm.nama_prasarana';
                    if (field === 'id')
                        return 'pm.id';
                    return `pm.${field}`;
                });
                query = query.select(mappedFields);
            }
            else {
                query = query.select("pm.id", "pm.nama_prasarana", "pm.kapasitas_prasarana", "pm.ukuran_prasarana", "pm.status_prasarana", "im.id as infrastruktur_id", "im.nama_infrastruktur");
            }
            const totalResult = await DB_1.default.from("prasarana_mcc")
                .where("is_active", true)
                .where("is_bookable", true)
                .count("id as total")
                .first();
            const total = parseInt(totalResult?.total || 0);
            const prasarana = await query
                .limit(toNumber(limit))
                .offset(offset);
            const formattedData = prasarana.map(item => ({
                id: item.id,
                infrastruktur_mcc_id: item.infrastruktur_id || item.infrastruktur_mcc_id,
                nama_prasarana: item.nama_prasarana,
                kapasitas_prasarana: item.kapasitas_prasarana,
                ukuran_prasarana: item.ukuran_prasarana,
                status_prasarana: item.status_prasarana,
                infrastruktur: item.nama_infrastruktur ? {
                    id: item.infrastruktur_id || item.infrastruktur_mcc_id,
                    nama_infrastruktur: item.nama_infrastruktur
                } : null
            }));
            const lastPage = Math.ceil(total / toNumber(limit));
            const nextPage = toNumber(page) < lastPage ? toNumber(page) + 1 : null;
            const previousPage = toNumber(page) > 1 ? toNumber(page) - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data prasarana berhasil diambil",
                data: formattedData,
                page: toNumber(page),
                total: total,
                perPage: toNumber(limit),
                lastPage: lastPage,
                nextPage: nextPage,
                previousPage: previousPage
            });
        }
        catch (error) {
            console.error("Error in getPrasaranaList:", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                data: null,
                errors: [error.message]
            });
        }
    }
    convertDateFormat(date) {
        const parts = date.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return date;
    }
}
exports.default = new EventApiController();
//# sourceMappingURL=EventApiController.js.map