"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('feedback_lainnya', (table) => {
        table.increments('id').primary();
        table.integer('feedback_data_diri_id').unsigned().notNullable();
        table.integer('booking_event_id').unsigned().nullable();
        table.integer('prasarana_id').unsigned().nullable();
        table.integer('rating_fasilitas').notNullable().defaultTo(5);
        table.text('komentar_fasilitas').nullable();
        table.integer('rating_kebersihan').notNullable().defaultTo(5);
        table.text('komentar_kebersihan').nullable();
        table.integer('rating_pelayanan').notNullable().defaultTo(5);
        table.text('komentar_pelayanan').nullable();
        table.integer('rating_keamanan').notNullable().defaultTo(5);
        table.text('komentar_keamanan').nullable();
        table.integer('rating_akses').notNullable().defaultTo(5);
        table.text('komentar_akses').nullable();
        table.text('masalah_teknis').nullable();
        table.text('saran_perbaikan').nullable();
        table.boolean('akan_gunakan_lagi').defaultTo(true);
        table.text('alasan_tidak_gunakan').nullable();
        table.enum('tingkat_kepentingan', ['tidak_penting', 'kurang_penting', 'penting', 'sangat_penting']).defaultTo('penting');
        table.timestamps(true, true);
        table.foreign('feedback_data_diri_id').references('id').inTable('feedback_data_diri').onDelete('CASCADE');
        table.foreign('booking_event_id').references('id').inTable('booking_events').onDelete('SET NULL');
        table.foreign('prasarana_id').references('id').inTable('prasarana_mcc').onDelete('SET NULL');
        table.index('feedback_data_diri_id');
        table.index('booking_event_id');
        table.index('prasarana_id');
        table.index('rating_fasilitas');
        table.index('akan_gunakan_lagi');
        table.index('tingkat_kepentingan');
        table.index(['prasarana_id', 'rating_fasilitas']);
        table.index(['booking_event_id', 'rating_fasilitas']);
    });
    await knex.raw(`
    CREATE VIEW facility_rating_statistics AS
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
    GROUP BY p.id, p.nama_prasarana
  `);
    await knex.raw(`
    CREATE VIEW monthly_feedback_trends AS
    SELECT 
      strftime('%Y-%m', fdd.tanggal_feedback) as month_year,
      COUNT(fl.id) as total_feedback,
      AVG(fl.rating_fasilitas) as avg_rating,
      COUNT(CASE WHEN fl.akan_gunakan_lagi = 1 THEN 1 END) as satisfaction_count
    FROM feedback_lainnya fl
    JOIN feedback_data_diri fdd ON fl.feedback_data_diri_id = fdd.id
    WHERE fdd.status_feedback = 'submitted' OR fdd.status_feedback = 'reviewed'
    GROUP BY strftime('%Y-%m', fdd.tanggal_feedback)
    ORDER BY month_year DESC
  `);
}
async function down(knex) {
    await knex.raw('DROP VIEW IF EXISTS monthly_feedback_trends');
    await knex.raw('DROP VIEW IF EXISTS facility_rating_statistics');
    await knex.schema.dropTableIfExists('feedback_lainnya');
}
//# sourceMappingURL=20250110_091300_create_feedback_lainnya.js.map