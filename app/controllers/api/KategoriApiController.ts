import DB from "../../services/DB";
import { Request, Response } from "../../../type";

class KategoriApiController {
  /**
   * GET /api/v1/kategori
   * Opsional query ?fields=id,nama untuk seleksi kolom tertentu
   */
  public async getKategori(request: Request, response: Response) {
    try {
      const fieldsParam = request.query.fields as string | undefined;
      const allowedFields = ["id", "nama", "created_at", "updated_at"];
      let fields: string[] = ["id", "nama"];
      if (fieldsParam) {
        const requested = fieldsParam.split(",").map(f => f.trim());
        fields = requested.filter(f => allowedFields.includes(f));
      }

      const data = await DB.from("kategori_instansi").select(fields);
      return response.status(200).json({
        statusCode: 200,
        message: "Daftar kategori berhasil diambil",
        data
      });
    } catch (error) {
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

export default new KategoriApiController(); 