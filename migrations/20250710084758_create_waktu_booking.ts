import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('waktu_booking', (table) => {
    table.increments('id').primary();
    table.time('waktu_mulai').notNullable();
    table.time('waktu_selesai').notNullable();
    table.string('label', 50).notNullable(); // e.g., "Pagi", "Siang", "Sore", "Malam"
    table.text('deskripsi').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['waktu_mulai']);
    table.index(['waktu_selesai']);
    table.index(['is_active']);
    table.index(['label']);
    
    // Unique constraint to prevent overlapping time slots
    table.unique(['waktu_mulai', 'waktu_selesai']);
  });

  // Insert default time slots
  await knex('waktu_booking').insert([
    {
      waktu_mulai: '07:00:00',
      waktu_selesai: '09:00:00',
      label: 'Pagi Awal',
      deskripsi: 'Slot waktu pagi awal',
      is_active: true
    },
    {
      waktu_mulai: '09:00:00',
      waktu_selesai: '11:00:00',
      label: 'Pagi',
      deskripsi: 'Slot waktu pagi',
      is_active: true
    },
    {
      waktu_mulai: '11:00:00',
      waktu_selesai: '13:00:00',
      label: 'Siang Awal',
      deskripsi: 'Slot waktu menjelang siang',
      is_active: true
    },
    {
      waktu_mulai: '13:00:00',
      waktu_selesai: '15:00:00',
      label: 'Siang',
      deskripsi: 'Slot waktu siang',
      is_active: true
    },
    {
      waktu_mulai: '15:00:00',
      waktu_selesai: '17:00:00',
      label: 'Sore Awal',
      deskripsi: 'Slot waktu sore awal',
      is_active: true
    },
    {
      waktu_mulai: '17:00:00',
      waktu_selesai: '19:00:00',
      label: 'Sore',
      deskripsi: 'Slot waktu sore',
      is_active: true
    },
    {
      waktu_mulai: '19:00:00',
      waktu_selesai: '21:00:00',
      label: 'Malam',
      deskripsi: 'Slot waktu malam',
      is_active: true
    },
    {
      waktu_mulai: '21:00:00',
      waktu_selesai: '23:00:00',
      label: 'Malam Akhir',
      deskripsi: 'Slot waktu malam akhir',
      is_active: true
    },
    // Full day slots
    {
      waktu_mulai: '07:00:00',
      waktu_selesai: '17:00:00',
      label: 'Seharian Kerja',
      deskripsi: 'Slot waktu seharian untuk jam kerja',
      is_active: true
    },
    {
      waktu_mulai: '07:00:00',
      waktu_selesai: '23:00:00',
      label: 'Seharian Penuh',
      deskripsi: 'Slot waktu seharian penuh',
      is_active: true
    },
    // Half day slots
    {
      waktu_mulai: '07:00:00',
      waktu_selesai: '13:00:00',
      label: 'Setengah Hari Pagi',
      deskripsi: 'Slot waktu setengah hari pagi',
      is_active: true
    },
    {
      waktu_mulai: '13:00:00',
      waktu_selesai: '19:00:00',
      label: 'Setengah Hari Sore',
      deskripsi: 'Slot waktu setengah hari sore',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('waktu_booking');
} 