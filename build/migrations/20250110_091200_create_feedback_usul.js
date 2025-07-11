"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('feedback_usul', (table) => {
        table.increments('id').primary();
        table.integer('feedback_data_diri_id').unsigned().notNullable();
        table.text('kolaborasi_perlibatan').nullable();
        table.text('penjelasan_kegiatan').nullable();
        table.text('keluhan').nullable();
        table.text('saran').nullable();
        table.text('harapan_masa_depan').nullable();
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
        table.text('response_admin').nullable();
        table.date('target_implementasi').nullable();
        table.timestamps(true, true);
        table.foreign('feedback_data_diri_id').references('id').inTable('feedback_data_diri').onDelete('CASCADE');
        table.index('feedback_data_diri_id');
        table.index('prioritas');
        table.index('kategori_usul');
        table.index('status_review');
        table.index('target_implementasi');
        table.index(['kategori_usul', 'prioritas']);
        table.index(['status_review', 'prioritas']);
    });
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
async function down(knex) {
    await knex.raw('DROP VIEW IF EXISTS usul_statistics');
    await knex.schema.dropTableIfExists('feedback_usul');
}
//# sourceMappingURL=20250110_091200_create_feedback_usul.js.map