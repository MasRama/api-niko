import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('responden', (table) => {
    table.increments('id').primary();
    table.string('tipe_responden', 100).notNullable();
    table.text('deskripsi').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['tipe_responden']);
    table.index(['is_active']);
  });

  // Insert default responden types
  await knex('responden').insert([
    {
      tipe_responden: 'Pengguna Fasilitas',
      deskripsi: 'Responden yang menggunakan fasilitas MCC',
      is_active: true
    },
    {
      tipe_responden: 'Pengunjung Event',
      deskripsi: 'Responden yang menghadiri event di MCC',
      is_active: true
    },
    {
      tipe_responden: 'Peserta Workshop',
      deskripsi: 'Responden yang mengikuti workshop atau pelatihan',
      is_active: true
    },
    {
      tipe_responden: 'Tenant UMKM',
      deskripsi: 'Responden yang menjadi tenant atau penyewa ruang',
      is_active: true
    },
    {
      tipe_responden: 'Pengunjung Umum',
      deskripsi: 'Responden pengunjung umum MCC',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('responden');
} 