import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prasarana_mcc', (table) => {
    table.increments('id').primary();
    table.integer('infrastruktur_mcc_id').unsigned().nullable();
    table.string('nama_prasarana', 100).notNullable();
    table.text('deskripsi').nullable();
    table.string('gambar', 500).nullable(); // Path ke gambar ruangan
    table.integer('kapasitas').nullable(); // Kapasitas orang
    table.string('ukuran', 50).nullable(); // e.g., "10x8 meter"
    table.text('fasilitas').nullable(); // JSON string atau text list fasilitas
    table.decimal('biaya_sewa', 15, 2).nullable(); // Biaya sewa per jam/hari
    table.string('status', 20).defaultTo('available'); // available, maintenance, booked
    table.string('lantai', 20).notNullable(); // Lantai 2, Lantai 3, etc
    table.boolean('is_bookable').defaultTo(true); // Apakah bisa dibooking
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign key constraint
    table.foreign('infrastruktur_mcc_id').references('id').inTable('infrastruktur_mcc').onDelete('SET NULL');
    
    // Indexes
    table.index(['infrastruktur_mcc_id']);
    table.index(['nama_prasarana']);
    table.index(['status']);
    table.index(['lantai']);
    table.index(['is_bookable']);
    table.index(['is_active']);
  });

  // Insert sample prasarana data based on frontend lantaiData
  await knex('prasarana_mcc').insert([
    // Lantai 2 - Multipurpose Area
    {
      infrastruktur_mcc_id: 1, // Multipurpose Area
      nama_prasarana: 'Main Hall',
      deskripsi: 'Ruang utama untuk acara besar',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/mainHall.png',
      kapasitas: 200,
      ukuran: '20x15 meter',
      fasilitas: 'Sound system, Projector, AC, Lighting',
      biaya_sewa: 500000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'MCC Planning Gallery',
      deskripsi: 'Galeri perencanaan MCC',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/planningGalery.jpg',
      kapasitas: 50,
      ukuran: '10x8 meter',
      fasilitas: 'Display screens, AC',
      biaya_sewa: 200000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 7, // Studio & Foto
      nama_prasarana: 'Broadcast',
      deskripsi: 'Studio broadcast dan streaming',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/broadcast.jpg',
      kapasitas: 10,
      ukuran: '6x4 meter',
      fasilitas: 'Camera, Lighting, Green screen, Audio equipment',
      biaya_sewa: 300000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 7,
      nama_prasarana: 'Podcast',
      deskripsi: 'Studio podcast dan recording',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/podcast.jpg',
      kapasitas: 6,
      ukuran: '4x4 meter',
      fasilitas: 'Microphones, Audio mixer, Soundproof',
      biaya_sewa: 200000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'Teras Utara',
      deskripsi: 'Teras outdoor bagian utara',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/terasUtara.jpg',
      kapasitas: 30,
      ukuran: '8x6 meter',
      fasilitas: 'Outdoor seating, Natural lighting',
      biaya_sewa: 150000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'Teras Selatan',
      deskripsi: 'Teras outdoor bagian selatan',
      gambar: 'assets/images/facility/ruangKreative/lantai-2/terasSelatan.jpg',
      kapasitas: 30,
      ukuran: '8x6 meter',
      fasilitas: 'Outdoor seating, Natural lighting',
      biaya_sewa: 150000.00,
      status: 'available',
      lantai: 'Lantai 2',
      is_bookable: true,
      is_active: true
    },

    // Lantai 3
    {
      infrastruktur_mcc_id: 3, // Ruang Rapat
      nama_prasarana: 'Ruang Kelas',
      deskripsi: 'Ruang kelas untuk training',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/ruangKelas.jpg',
      kapasitas: 40,
      ukuran: '12x8 meter',
      fasilitas: 'Whiteboard, Projector, AC, Tables, Chairs',
      biaya_sewa: 250000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 3,
      nama_prasarana: 'Ruang Meeting',
      deskripsi: 'Ruang meeting untuk diskusi',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/ruangMeeting.jpg',
      kapasitas: 15,
      ukuran: '6x4 meter',
      fasilitas: 'Conference table, TV screen, AC, Whiteboard',
      biaya_sewa: 200000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'Multifunction Room',
      deskripsi: 'Ruang multifungsi',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/multiFungsi.jpg',
      kapasitas: 80,
      ukuran: '15x10 meter',
      fasilitas: 'Flexible seating, Sound system, Projector, AC',
      biaya_sewa: 400000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'Open Public Space Utara',
      deskripsi: 'Ruang publik terbuka bagian utara',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/spaceUtara.jpg',
      kapasitas: 50,
      ukuran: '12x8 meter',
      fasilitas: 'Open space, Natural lighting, AC',
      biaya_sewa: 100000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 1,
      nama_prasarana: 'Open Public Space Barat',
      deskripsi: 'Ruang publik terbuka bagian barat',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/openPublic.jpg',
      kapasitas: 50,
      ukuran: '12x8 meter',
      fasilitas: 'Open space, Natural lighting, AC',
      biaya_sewa: 100000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 6, // Cafe & Kantin
      nama_prasarana: 'Food Lab',
      deskripsi: 'Laboratorium makanan dan kuliner',
      gambar: 'assets/images/facility/ruangKreative/lantai-3/foodLab.jpg',
      kapasitas: 20,
      ukuran: '10x6 meter',
      fasilitas: 'Kitchen equipment, Cooking tools, Refrigerator',
      biaya_sewa: 300000.00,
      status: 'available',
      lantai: 'Lantai 3',
      is_bookable: true,
      is_active: true
    },

    // Lantai 4
    {
      infrastruktur_mcc_id: 4, // Workshop
      nama_prasarana: 'Lab Komputer',
      deskripsi: 'Laboratorium komputer',
      gambar: 'assets/images/facility/ruangKreative/lantai-4/lab.jpg',
      kapasitas: 30,
      ukuran: '12x8 meter',
      fasilitas: 'Computers, Internet, AC, Projector',
      biaya_sewa: 350000.00,
      status: 'available',
      lantai: 'Lantai 4',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 4,
      nama_prasarana: 'Ruang Kriya',
      deskripsi: 'Ruang untuk kegiatan kriya dan kerajinan',
      gambar: 'assets/images/facility/ruangKreative/lantai-4/kriya.jpg',
      kapasitas: 25,
      ukuran: '10x8 meter',
      fasilitas: 'Work tables, Tools, Storage, AC',
      biaya_sewa: 250000.00,
      status: 'available',
      lantai: 'Lantai 4',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 4,
      nama_prasarana: 'Ruang Galery Seni',
      deskripsi: 'Galeri untuk pameran seni',
      gambar: 'assets/images/facility/ruangKreative/lantai-4/galery.jpg',
      kapasitas: 60,
      ukuran: '15x10 meter',
      fasilitas: 'Display walls, Lighting, AC, Security',
      biaya_sewa: 400000.00,
      status: 'available',
      lantai: 'Lantai 4',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 7, // Studio & Foto
      nama_prasarana: 'Studio Musik',
      deskripsi: 'Studio musik dan recording',
      gambar: 'assets/images/facility/ruangKreative/lantai-4/studio.jpg',
      kapasitas: 15,
      ukuran: '8x6 meter',
      fasilitas: 'Musical instruments, Recording equipment, Soundproof',
      biaya_sewa: 400000.00,
      status: 'available',
      lantai: 'Lantai 4',
      is_bookable: true,
      is_active: true
    },

    // Lantai 5
    {
      infrastruktur_mcc_id: 8, // Amphitheater
      nama_prasarana: 'Amphitheater',
      deskripsi: 'Ruang amphitheater untuk pertunjukan',
      gambar: 'assets/images/facility/ruangKreative/lantai-5/amphitheater.jpg',
      kapasitas: 150,
      ukuran: '20x15 meter',
      fasilitas: 'Stage, Sound system, Lighting, Tiered seating',
      biaya_sewa: 800000.00,
      status: 'available',
      lantai: 'Lantai 5',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 5, // Coworking Space
      nama_prasarana: 'Co-Working Space',
      deskripsi: 'Ruang kerja bersama',
      gambar: 'assets/images/facility/ruangKreative/lantai-5/coworking.jpg',
      kapasitas: 40,
      ukuran: '15x10 meter',
      fasilitas: 'Desks, Chairs, WiFi, Power outlets, AC',
      biaya_sewa: 300000.00,
      status: 'available',
      lantai: 'Lantai 5',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 7,
      nama_prasarana: 'Studio Foto',
      deskripsi: 'Studio fotografi profesional',
      gambar: 'assets/images/facility/ruangKreative/lantai-5/studio.jpg',
      kapasitas: 10,
      ukuran: '8x6 meter',
      fasilitas: 'Photography equipment, Lighting, Backdrops',
      biaya_sewa: 350000.00,
      status: 'available',
      lantai: 'Lantai 5',
      is_bookable: true,
      is_active: true
    },
    {
      infrastruktur_mcc_id: 4, // Workshop
      nama_prasarana: 'Ruang Fashion',
      deskripsi: 'Ruang untuk kegiatan fashion dan desain',
      gambar: 'assets/images/facility/ruangKreative/lantai-5/fashion.jpg',
      kapasitas: 20,
      ukuran: '10x8 meter',
      fasilitas: 'Sewing machines, Mannequins, Design tables, AC',
      biaya_sewa: 300000.00,
      status: 'available',
      lantai: 'Lantai 5',
      is_bookable: true,
      is_active: true
    },

    // Lantai 6
    {
      infrastruktur_mcc_id: 9, // Office Room
      nama_prasarana: 'Perpustakaan',
      deskripsi: 'Perpustakaan dan ruang baca',
      gambar: 'assets/images/facility/ruangKreative/lantai-6/perpustakaan.jpg',
      kapasitas: 60,
      ukuran: '15x12 meter',
      fasilitas: 'Books, Reading tables, WiFi, AC, Quiet zone',
      biaya_sewa: 200000.00,
      status: 'available',
      lantai: 'Lantai 6',
      is_bookable: true,
      is_active: true
    },

    // Lantai 7
    {
      infrastruktur_mcc_id: 11, // Auditorium
      nama_prasarana: 'Auditorium',
      deskripsi: 'Auditorium untuk acara besar',
      gambar: 'assets/images/facility/ruangKreative/lantai-7/auditorium.jpg',
      kapasitas: 300,
      ukuran: '25x20 meter',
      fasilitas: 'Stage, Professional sound system, Lighting, Fixed seating',
      biaya_sewa: 1000000.00,
      status: 'available',
      lantai: 'Lantai 7',
      is_bookable: true,
      is_active: true
    },

    // Lantai 8
    {
      infrastruktur_mcc_id: 1, // Multipurpose Area
      nama_prasarana: 'Outdoor',
      deskripsi: 'Area outdoor untuk acara terbuka',
      gambar: 'assets/images/facility/ruangKreative/lantai-8/outdoor.jpg',
      kapasitas: 100,
      ukuran: '20x15 meter',
      fasilitas: 'Open air, Natural lighting, Weather dependent',
      biaya_sewa: 250000.00,
      status: 'available',
      lantai: 'Lantai 8',
      is_bookable: true,
      is_active: true
    }
  ]);

  // Recreate view facility_rating_statistics setelah tabel prasarana_mcc tersedia
  await knex.raw(`
    CREATE VIEW IF NOT EXISTS facility_rating_statistics AS
    SELECT 
      p.id as prasarana_id,
      p.nama_prasarana,
      COUNT(fl.id) as total_feedback,
      AVG(fl.rating_fasilitas) as avg_rating_fasilitas,
      AVG(fl.rating_kebersihan) as avg_rating_kebersihan,
      AVG(fl.rating_pelayanan) as avg_rating_pelayanan,
      AVG(fl.rating_keamanan) as avg_rating_keamanan,
      AVG(fl.rating_akses) as avg_rating_akses,
      AVG((fl.rating_fasilitas + fl.rating_kebersihan + fl.rating_pelayanan + fl.rating_keamanan + fl.rating_akses) / 5.0) as avg_rating_overall,
      COUNT(CASE WHEN fl.akan_gunakan_lagi = 1 THEN 1 END) as will_use_again_count,
      COUNT(CASE WHEN fl.akan_gunakan_lagi = 0 THEN 1 END) as wont_use_again_count,
      COUNT(CASE WHEN fl.masalah_teknis IS NOT NULL AND fl.masalah_teknis != '' THEN 1 END) as technical_issues_count
    FROM prasarana_mcc p
    LEFT JOIN feedback_lainnya fl ON p.id = fl.prasarana_id
    LEFT JOIN feedback_data_diri fdd ON fl.feedback_data_diri_id = fdd.id
    WHERE fdd.status_feedback = 'submitted' OR fdd.status_feedback = 'reviewed' OR fdd.id IS NULL
    GROUP BY p.id, p.nama_prasarana;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS facility_rating_statistics');
  await knex.schema.dropTableIfExists('prasarana_mcc');
} 