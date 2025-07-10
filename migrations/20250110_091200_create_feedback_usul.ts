import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feedback_usul', (table) => {
    table.increments('id').primary();
    table.integer('feedback_data_diri_id').unsigned().notNullable();
    table.text('kolaborasi_perlibatan').nullable(); // Kolaborasi dan keterlibatan
    table.text('penjelasan_kegiatan').nullable(); // Penjelasan kegiatan yang diinginkan
    table.text('keluhan').nullable(); // Keluhan terhadap layanan
    table.text('saran').nullable(); // Saran perbaikan
    table.text('harapan_masa_depan').nullable(); // Harapan untuk masa depan
    table.enum('prioritas', ['rendah', 'sedang', 'tinggi', 'urgent']).defaultTo('sedang');
    table.enum('kategori_usul', [
      'fasilitas', 
      'layanan', 
      'event', 
      'infrastruktur', 
      'teknologi', 
      'kebijakan',
      'lainnya'
    ]).defaultTo('lainnya');
    table.enum('status_review', ['pending', 'in_review', 'approved', 'rejected', 'implemented']).defaultTo('pending');
    table.text('response_admin').nullable(); // Response dari admin
    table.date('target_implementasi').nullable(); // Target tanggal implementasi
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('feedback_data_diri_id').references('id').inTable('feedback_data_diri').onDelete('CASCADE');
    
    // Indexes
    table.index('feedback_data_diri_id');
    table.index('prioritas');
    table.index('kategori_usul');
    table.index('status_review');
    table.index('target_implementasi');
    
    // Composite indexes for performance
    table.index(['kategori_usul', 'prioritas']);
    table.index(['status_review', 'prioritas']);
  });

  // Create view for usul statistics
  await knex.raw(`
    CREATE VIEW usul_statistics AS
    SELECT 
      kategori_usul,
      prioritas,
      status_review,
      COUNT(*) as total_usul,
      COUNT(CASE WHEN status_review = 'implemented' THEN 1 END) as implemented_count,
      COUNT(CASE WHEN status_review = 'pending' THEN 1 END) as pending_count,
      AVG(CASE 
        WHEN target_implementasi IS NOT NULL 
        THEN julianday(target_implementasi) - julianday(created_at) 
        ELSE NULL 
      END) as avg_target_days
    FROM feedback_usul
    GROUP BY kategori_usul, prioritas, status_review
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS usul_statistics');
  await knex.schema.dropTableIfExists('feedback_usul');
} 