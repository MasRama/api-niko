"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
class InfrastructureApiController {
    async getAllInfrastruktur(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const perPage = parseInt(request.query.per_page) || 10;
            const offset = (page - 1) * perPage;
            const totalResult = await DB_1.default.from("infrastruktur_mcc")
                .where("is_active", true)
                .count("* as total")
                .first();
            const total = totalResult?.total || 0;
            const lastPage = Math.ceil(total / perPage);
            const infrastrukturList = await DB_1.default.from("infrastruktur_mcc")
                .where("is_active", true)
                .orderBy("nama_infrastruktur", "asc")
                .limit(perPage)
                .offset(offset)
                .select([
                "id",
                "nama_infrastruktur",
                "deskripsi_infrastruktur",
                "icon_path",
                "lantai"
            ]);
            const infrastrukturWithPrasarana = await Promise.all(infrastrukturList.map(async (infra) => {
                const prasarana = await DB_1.default.from("prasarana_mcc")
                    .where("infrastruktur_mcc_id", infra.id)
                    .where("is_active", true)
                    .orderBy("nama_prasarana", "asc")
                    .select([
                    "id",
                    "nama_prasarana",
                    "deskripsi",
                    "gambar",
                    "kapasitas",
                    "biaya_sewa",
                    "ukuran",
                    "fasilitas",
                    "infrastruktur_mcc_id"
                ]);
                return {
                    id: infra.id.toString(),
                    nama_infrastruktur: infra.nama_infrastruktur,
                    deskripsi_infrastruktur: infra.deskripsi_infrastruktur,
                    prasarana: prasarana.map(p => ({
                        id: p.id.toString(),
                        nama_prasarana: p.nama_prasarana,
                        deskripsi_prasarana: p.deskripsi,
                        gambar_prasarana: p.gambar,
                        kapasitas_prasarana: p.kapasitas ? p.kapasitas.toString() : "0",
                        biaya_sewa: p.biaya_sewa === 0 ? "GRATIS" : p.biaya_sewa.toString(),
                        ukuran_prasarana: p.ukuran,
                        fasilitas: p.fasilitas,
                        infrastruktur_mcc_id: p.infrastruktur_mcc_id.toString()
                    }))
                };
            }));
            const nextPage = page < lastPage ? page + 1 : null;
            const previousPage = page > 1 ? page - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data infrastruktur berhasil diambil",
                data: infrastrukturWithPrasarana,
                page,
                total,
                perPage,
                lastPage,
                nextPage,
                previousPage
            });
        }
        catch (error) {
            console.error('Get all infrastruktur error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getInfrastrukturById(request, response) {
        try {
            const infrastrukturId = request.params.id;
            const infrastruktur = await DB_1.default.from("infrastruktur_mcc")
                .where("id", infrastrukturId)
                .where("is_active", true)
                .select([
                "id",
                "nama_infrastruktur",
                "deskripsi_infrastruktur",
                "icon_path",
                "lantai"
            ])
                .first();
            if (!infrastruktur) {
                return response.status(404).json({
                    statusCode: 404,
                    message: "Infrastruktur tidak ditemukan",
                    errors: ["Infrastruktur tidak ditemukan"],
                    data: null
                });
            }
            const prasarana = await DB_1.default.from("prasarana_mcc")
                .where("infrastruktur_mcc_id", infrastrukturId)
                .where("is_active", true)
                .orderBy("nama_prasarana", "asc")
                .select([
                "id",
                "nama_prasarana",
                "deskripsi",
                "gambar",
                "kapasitas",
                "biaya_sewa",
                "ukuran",
                "fasilitas",
                "infrastruktur_mcc_id"
            ]);
            const infrastrukturData = {
                id: infrastruktur.id.toString(),
                nama_infrastruktur: infrastruktur.nama_infrastruktur,
                deskripsi_infrastruktur: infrastruktur.deskripsi_infrastruktur,
                prasarana: prasarana.map(p => ({
                    id: p.id.toString(),
                    nama_prasarana: p.nama_prasarana,
                    deskripsi_prasarana: p.deskripsi,
                    gambar_prasarana: p.gambar,
                    kapasitas_prasarana: p.kapasitas ? p.kapasitas.toString() : "0",
                    biaya_sewa: p.biaya_sewa === 0 ? "GRATIS" : p.biaya_sewa.toString(),
                    ukuran_prasarana: p.ukuran,
                    fasilitas: p.fasilitas,
                    infrastruktur_mcc_id: p.infrastruktur_mcc_id.toString()
                }))
            };
            return response.status(200).json({
                statusCode: 200,
                message: "Data infrastruktur berhasil diambil",
                data: infrastrukturData
            });
        }
        catch (error) {
            console.error('Get infrastruktur by ID error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getBookingInfraList(request, response) {
        try {
            const userId = request.user.id;
            const page = parseInt(request.query.page) || 1;
            const perPage = parseInt(request.query.per_page) || 10;
            const prasaranaList = await DB_1.default.from("prasarana_mcc")
                .where("is_bookable", true)
                .where("is_active", true)
                .where("status", "available")
                .select([
                "id as prasarana_mcc_id",
                "nama_prasarana"
            ])
                .orderBy("nama_prasarana", "asc");
            const formattedData = prasaranaList.map(prasarana => ({
                prasarana_mcc_id: prasarana.prasarana_mcc_id.toString(),
                account_id: userId.toString(),
                nama_prasarana: prasarana.nama_prasarana
            }));
            const total = formattedData.length;
            const lastPage = Math.ceil(total / perPage);
            const startIndex = (page - 1) * perPage;
            const endIndex = startIndex + perPage;
            const paginatedData = formattedData.slice(startIndex, endIndex);
            const nextPage = page < lastPage ? page + 1 : null;
            const previousPage = page > 1 ? page - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Data prasarana untuk booking berhasil diambil",
                data: paginatedData,
                page,
                total,
                perPage,
                lastPage,
                nextPage,
                previousPage
            });
        }
        catch (error) {
            console.error('Get booking infra list error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async getFacilityOverview(request, response) {
        try {
            const infrastrukturOverview = await DB_1.default.from("infrastruktur_mcc")
                .where("is_active", true)
                .orderBy("nama_infrastruktur", "asc")
                .select([
                "id",
                "nama_infrastruktur as title",
                "lantai as description",
                "icon_path as icon"
            ]);
            const prasaranaByLantai = await DB_1.default.from("prasarana_mcc")
                .where("is_active", true)
                .orderBy("lantai", "asc")
                .orderBy("nama_prasarana", "asc")
                .select([
                "nama_prasarana as title",
                "gambar as imageUrl",
                "lantai"
            ]);
            const lantaiData = prasaranaByLantai.reduce((acc, prasarana) => {
                const lantai = prasarana.lantai;
                if (!acc[lantai]) {
                    acc[lantai] = {
                        title: lantai,
                        items: []
                    };
                }
                acc[lantai].items.push({
                    title: prasarana.title,
                    imageUrl: prasarana.imageUrl
                });
                return acc;
            }, {});
            const lantaiArray = Object.values(lantaiData);
            const fasilitasPenunjang = [
                'Main Stairs & Amphiteaters',
                'Animation & Motion Capture Studio',
                'Design Archives & City Planning Gallery',
                'Broadcast & Podcast Room',
                'Audio & Video Recording',
                'Training Institution',
                'Event Space',
                'Incubator',
                'Fashion Room',
                'Food Lab',
                'Smart Environment',
                'Ads Videotron',
                'Perpustakaan & Ruang Baca',
                'Fitness Room',
                'Multifunction Room',
                'MCC Digital Platform',
                'MCC Cafe & Lounge',
                'MCC KID Interactive Zone',
                'Workshop Seni',
                'Public Space',
                'Ruang Komputer',
                'Musholla & Pantry',
                'Lavatory',
                'Multimedia Videotron'
            ];
            return response.status(200).json({
                statusCode: 200,
                message: "Data facility overview berhasil diambil",
                data: {
                    sarana_prasarana: infrastrukturOverview,
                    ruang_kreatif: lantaiArray,
                    fasilitas_penunjang: fasilitasPenunjang
                }
            });
        }
        catch (error) {
            console.error('Get facility overview error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
    async searchPrasarana(request, response) {
        try {
            const searchTerm = request.query.q;
            const page = parseInt(request.query.page) || 1;
            const perPage = parseInt(request.query.per_page) || 10;
            const offset = (page - 1) * perPage;
            if (!searchTerm) {
                return response.status(422).json({
                    statusCode: 422,
                    message: "Parameter pencarian wajib diisi",
                    errors: [
                        {
                            rule: "required",
                            field: "q",
                            message: "Parameter pencarian wajib diisi"
                        }
                    ],
                    data: null
                });
            }
            const prasaranaQuery = DB_1.default.from("prasarana_mcc as p")
                .leftJoin("infrastruktur_mcc as i", "p.infrastruktur_mcc_id", "i.id")
                .where("p.is_active", true)
                .where("p.is_bookable", true)
                .where(function () {
                this.where("p.nama_prasarana", "like", `%${searchTerm}%`)
                    .orWhere("i.nama_infrastruktur", "like", `%${searchTerm}%`)
                    .orWhere("p.lantai", "like", `%${searchTerm}%`);
            });
            const totalResult = await prasaranaQuery.clone().count("* as total").first();
            const total = totalResult?.total || 0;
            const lastPage = Math.ceil(total / perPage);
            const prasaranaList = await prasaranaQuery
                .select([
                "p.id",
                "p.nama_prasarana",
                "p.deskripsi",
                "p.gambar",
                "p.kapasitas",
                "p.biaya_sewa",
                "p.ukuran",
                "p.fasilitas",
                "p.lantai",
                "i.nama_infrastruktur",
                "i.id as infrastruktur_id"
            ])
                .orderBy("p.nama_prasarana", "asc")
                .limit(perPage)
                .offset(offset);
            const formattedData = prasaranaList.map(p => ({
                id: p.id.toString(),
                nama_prasarana: p.nama_prasarana,
                deskripsi_prasarana: p.deskripsi,
                gambar_prasarana: p.gambar,
                kapasitas_prasarana: p.kapasitas ? p.kapasitas.toString() : "0",
                biaya_sewa: p.biaya_sewa === 0 ? "GRATIS" : p.biaya_sewa.toString(),
                ukuran_prasarana: p.ukuran,
                fasilitas: p.fasilitas,
                lantai: p.lantai,
                infrastruktur: {
                    id: p.infrastruktur_id ? p.infrastruktur_id.toString() : null,
                    nama_infrastruktur: p.nama_infrastruktur
                }
            }));
            const nextPage = page < lastPage ? page + 1 : null;
            const previousPage = page > 1 ? page - 1 : null;
            return response.status(200).json({
                statusCode: 200,
                message: "Hasil pencarian prasarana",
                data: formattedData,
                page,
                total,
                perPage,
                lastPage,
                nextPage,
                previousPage
            });
        }
        catch (error) {
            console.error('Search prasarana error:', error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
}
exports.default = new InfrastructureApiController();
//# sourceMappingURL=InfrastructureApiController.js.map