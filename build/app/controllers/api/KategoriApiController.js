"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../../services/DB"));
class KategoriApiController {
    async getKategori(request, response) {
        try {
            const fieldsParam = request.query.fields;
            const allowedFields = ["id", "nama", "created_at", "updated_at"];
            let fields = ["id", "nama"];
            if (fieldsParam) {
                const requested = fieldsParam.split(",").map(f => f.trim());
                fields = requested.filter(f => allowedFields.includes(f));
            }
            const data = await DB_1.default.from("kategori_instansi").select(fields);
            return response.status(200).json({
                statusCode: 200,
                message: "Daftar kategori berhasil diambil",
                data
            });
        }
        catch (error) {
            console.error("KategoriApiController.getKategori error", error);
            return response.status(500).json({
                statusCode: 500,
                message: "Terjadi kesalahan server",
                errors: ["Internal server error"],
                data: null
            });
        }
    }
}
exports.default = new KategoriApiController();
//# sourceMappingURL=KategoriApiController.js.map