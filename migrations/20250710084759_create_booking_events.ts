import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('booking_events', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('account_id').notNullable(); // user_id yang booking (personal atau instansi)
    table.string('kode_booking', 50).notNullable().unique(); // auto-generated booking code
    table.string('nama_event', 255).notNullable();
    table.integer('kategori_event_id').unsigned().nullable();
    table.integer('ekraf_id').unsigned().nullable();
    table.integer('sdgs_id').unsigned().nullable();
    table.string('tipe_event', 50).notNullable(); // personal, instansi
    table.text('deskripsi').nullable();
    table.integer('estimasi_peserta').nullable();
    table.string('nama_pic', 255).notNullable();
    table.string('no_telp_pic', 50).notNullable();
    table.string('jenis_event', 100).nullable(); // workshop, seminar, dll
    table.string('status_persetujuan', 20).defaultTo('pending'); // pending, approved, rejected
    table.string('banner_event', 500).nullable(); // path to banner file
    table.string('proposal_event', 500).nullable(); // path to proposal file
    table.string('ttd', 500).nullable(); // path to signature file
    table.text('detail_peralatan').nullable(); // equipment details
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('account_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('kategori_event_id').references('id').inTable('kategori_event').onDelete('SET NULL');
    table.foreign('ekraf_id').references('id').inTable('ekraf').onDelete('SET NULL');
    table.foreign('sdgs_id').references('id').inTable('sdgs').onDelete('SET NULL');
    
    // Indexes for performance
    table.index(['account_id']);
    table.index(['kode_booking']);
    table.index(['status_persetujuan']);
    table.index(['tipe_event']);
    table.index(['kategori_event_id']);
    table.index(['created_at']);
  });
  
  // Add trigger function to auto-generate booking code
  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS generate_booking_code 
    AFTER INSERT ON booking_events
    FOR EACH ROW
    WHEN NEW.kode_booking IS NULL OR NEW.kode_booking = ''
    BEGIN
      UPDATE booking_events 
      SET kode_booking = 'BK' || strftime('%Y%m%d', 'now') || '-' || 
          substr('000' || (SELECT COUNT(*) FROM booking_events WHERE date(created_at) = date('now')), -3, 3)
      WHERE id = NEW.id;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS generate_booking_code');
  await knex.schema.dropTableIfExists('booking_events');
} 