import DB from "../../services/DB";
import { Request, Response } from "../../../type";

class InfrastructureApiController {
  /**
   * Get all infrastructure with pagination and prasarana
   * GET /api/v1/infrastructure/list
   */
  public async getAllInfrastruktur(request: Request, response: Response) {
    try {
      const page = parseInt(request.query.page as string) || 1;
      const perPage = parseInt(request.query.per_page as string) || 10;
      const offset = (page - 1) * perPage;

      // Get total count
      const totalResult = await DB.from("infrastruktur_mcc")
        .where("is_active", true)
        .count("* as total")
        .first();
      
      const total = totalResult?.total || 0;
      const lastPage = Math.ceil(total / perPage);

      // Get infrastructure data with pagination
      const infrastrukturList = await DB.from("infrastruktur_mcc")
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

      // Get prasarana for each infrastructure
      const infrastrukturWithPrasarana = await Promise.all(
        infrastrukturList.map(async (infra) => {
          const prasarana = await DB.from("prasarana_mcc")
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
        })
      );

      // Calculate pagination metadata
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

    } catch (error) {
      console.error('Get all infrastruktur error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get infrastructure by ID with prasarana
   * GET /api/v1/infrastructure/:id
   */
  public async getInfrastrukturById(request: Request, response: Response) {
    try {
      const infrastrukturId = request.params.id;

      // Get infrastructure data
      const infrastruktur = await DB.from("infrastruktur_mcc")
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

      // Get prasarana for this infrastructure
      const prasarana = await DB.from("prasarana_mcc")
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

      // Format response sesuai frontend model
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

    } catch (error) {
      console.error('Get infrastruktur by ID error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get infrastructure list for booking (simplified)
   * GET /api/v1/booking/infra-user
   */
  public async getBookingInfraList(request: Request, response: Response) {
    try {
      const userId = request.user.id;
      const page = parseInt(request.query.page as string) || 1;
      const perPage = parseInt(request.query.per_page as string) || 10;

      // Get prasarana that are bookable
      const prasaranaList = await DB.from("prasarana_mcc")
        .where("is_bookable", true)
        .where("is_active", true)
        .where("status", "available")
        .select([
          "id as prasarana_mcc_id",
          "nama_prasarana"
        ])
        .orderBy("nama_prasarana", "asc");

      // Format response sesuai frontend FilterruangnModel
      const formattedData = prasaranaList.map(prasarana => ({
        prasarana_mcc_id: prasarana.prasarana_mcc_id.toString(),
        account_id: userId.toString(),
        nama_prasarana: prasarana.nama_prasarana
      }));

      // Calculate pagination
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

    } catch (error) {
      console.error('Get booking infra list error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Get facility overview data (for facility page)
   * GET /api/v1/infrastructure/facility-overview
   */
  public async getFacilityOverview(request: Request, response: Response) {
    try {
      // Get infrastructure overview
      const infrastrukturOverview = await DB.from("infrastruktur_mcc")
        .where("is_active", true)
        .orderBy("nama_infrastruktur", "asc")
        .select([
          "id",
          "nama_infrastruktur as title",
          "lantai as description",
          "icon_path as icon"
        ]);

      // Get prasarana grouped by lantai
      const prasaranaByLantai = await DB.from("prasarana_mcc")
        .where("is_active", true)
        .orderBy("lantai", "asc")
        .orderBy("nama_prasarana", "asc")
        .select([
          "nama_prasarana as title",
          "gambar as imageUrl",
          "lantai"
        ]);

      // Group prasarana by lantai
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
      }, {} as any);

      // Convert to array format
      const lantaiArray = Object.values(lantaiData);

      // Fasilitas penunjang (static data from frontend)
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

    } catch (error) {
      console.error('Get facility overview error:', error);
      return response.status(500).json({
        statusCode: 500,
        message: "Terjadi kesalahan server",
        errors: ["Internal server error"],
        data: null
      });
    }
  }

  /**
   * Search prasarana by name
   * GET /api/v1/infrastructure/search-prasarana
   */
  public async searchPrasarana(request: Request, response: Response) {
    try {
      const searchTerm = request.query.q as string;
      const page = parseInt(request.query.page as string) || 1;
      const perPage = parseInt(request.query.per_page as string) || 10;
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

      // Search prasarana
      const prasaranaQuery = DB.from("prasarana_mcc as p")
        .leftJoin("infrastruktur_mcc as i", "p.infrastruktur_mcc_id", "i.id")
        .where("p.is_active", true)
        .where("p.is_bookable", true)
        .where(function() {
          this.where("p.nama_prasarana", "like", `%${searchTerm}%`)
              .orWhere("i.nama_infrastruktur", "like", `%${searchTerm}%`)
              .orWhere("p.lantai", "like", `%${searchTerm}%`);
        });

      // Get total count
      const totalResult = await prasaranaQuery.clone().count("* as total").first();
      const total = totalResult?.total || 0;
      const lastPage = Math.ceil(total / perPage);

      // Get paginated results
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

      // Format response
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

    } catch (error) {
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

export default new InfrastructureApiController(); 