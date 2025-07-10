import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('infrastruktur_mcc', (table) => {
    table.increments('id').primary();
    table.string('nama_infrastruktur', 100).notNullable();
    table.text('deskripsi_infrastruktur').nullable();
    table.string('icon_path', 500).nullable(); // Path ke icon SVG
    table.string('lantai', 50).nullable(); // Lantai 2, 3, & 5 (bisa multiple)
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['nama_infrastruktur']);
    table.index(['is_active']);
    table.index(['lantai']);
  });

  // Insert default infrastructure data based on frontend facilityData
  await knex('infrastruktur_mcc').insert([
    {
      nama_infrastruktur: 'Multipurpose Area',
      deskripsi_infrastruktur: 'Area serbaguna untuk berbagai kegiatan',
      icon_path: 'assets/images/facility/multipurporse.svg',
      lantai: 'Lantai 2, 3, & 5',
      is_active: true
    },
    {
      nama_infrastruktur: 'Creative Design Store',
      deskripsi_infrastruktur: 'Toko dan ruang display desain kreatif',
      icon_path: 'assets/images/facility/creative.svg',
      lantai: 'Lantai 3',
      is_active: true
    },
    {
      nama_infrastruktur: 'Ruang Rapat',
      deskripsi_infrastruktur: 'Ruang untuk pertemuan dan rapat',
      icon_path: 'assets/images/facility/ruangRapat.svg',
      lantai: 'Lantai 3',
      is_active: true
    },
    {
      nama_infrastruktur: 'Workshop',
      deskripsi_infrastruktur: 'Ruang untuk kegiatan workshop dan pelatihan',
      icon_path: 'assets/images/facility/workshop.svg',
      lantai: 'Lantai 4',
      is_active: true
    },
    {
      nama_infrastruktur: 'Coworking Space',
      deskripsi_infrastruktur: 'Ruang kerja bersama',
      icon_path: 'assets/images/facility/coworking.svg',
      lantai: 'Lantai 4 & 5',
      is_active: true
    },
    {
      nama_infrastruktur: 'Cafe & Kantin',
      deskripsi_infrastruktur: 'Area makan dan minum',
      icon_path: 'assets/images/facility/cafe.svg',
      lantai: 'Lantai 3 & 5',
      is_active: true
    },
    {
      nama_infrastruktur: 'Studio & Foto',
      deskripsi_infrastruktur: 'Studio untuk fotografi dan video',
      icon_path: 'assets/images/facility/studio.svg',
      lantai: 'Lantai 5',
      is_active: true
    },
    {
      nama_infrastruktur: 'Amphitheater',
      deskripsi_infrastruktur: 'Ruang pertunjukan amphitheater',
      icon_path: 'assets/images/facility/amphitheater.svg',
      lantai: 'Lantai 5',
      is_active: true
    },
    {
      nama_infrastruktur: 'Office Room',
      deskripsi_infrastruktur: 'Ruang kantor',
      icon_path: 'assets/images/facility/office.svg',
      lantai: 'Lantai 6',
      is_active: true
    },
    {
      nama_infrastruktur: 'UMKM Super Store',
      deskripsi_infrastruktur: 'Toko UMKM dan produk lokal',
      icon_path: 'assets/images/facility/umkm.svg',
      lantai: 'Lantai 6',
      is_active: true
    },
    {
      nama_infrastruktur: 'Auditorium',
      deskripsi_infrastruktur: 'Ruang auditorium untuk acara besar',
      icon_path: 'assets/images/facility/auditorium.svg',
      lantai: 'Lantai 7',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('infrastruktur_mcc');
} 