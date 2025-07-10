import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('kategori_event', (table) => {
    table.increments('id').primary();
    table.string('nama_kategori', 100).notNullable();
    table.text('deskripsi').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['nama_kategori']);
    table.index(['is_active']);
  });

  // Insert default categories
  await knex('kategori_event').insert([
    {
      nama_kategori: 'Workshop',
      deskripsi: 'Kegiatan pelatihan dan pembelajaran',
      is_active: true
    },
    {
      nama_kategori: 'Seminar',
      deskripsi: 'Kegiatan seminar dan diskusi',
      is_active: true
    },
    {
      nama_kategori: 'Pameran',
      deskripsi: 'Kegiatan pameran dan display',
      is_active: true
    },
    {
      nama_kategori: 'Konferensi',
      deskripsi: 'Kegiatan konferensi dan pertemuan besar',
      is_active: true
    },
    {
      nama_kategori: 'Festival',
      deskripsi: 'Kegiatan festival dan perayaan',
      is_active: true
    },
    {
      nama_kategori: 'Kompetisi',
      deskripsi: 'Kegiatan kompetisi dan lomba',
      is_active: true
    },
    {
      nama_kategori: 'Pelatihan',
      deskripsi: 'Kegiatan pelatihan keterampilan',
      is_active: true
    },
    {
      nama_kategori: 'Lainnya',
      deskripsi: 'Kategori event lainnya',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('kategori_event');
} 