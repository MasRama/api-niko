"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('user_responded', (table) => {
        table.increments('id').primary();
        table.integer('feedback_data_diri_id').unsigned().notNullable();
        table.integer('sub_responden_id').unsigned().notNullable();
        table.integer('nilai_rating').notNullable();
        table.text('komentar').nullable();
        table.timestamps(true, true);
        table.foreign('feedback_data_diri_id').references('id').inTable('feedback_data_diri').onDelete('CASCADE');
        table.foreign('sub_responden_id').references('id').inTable('sub_responden').onDelete('CASCADE');
        table.index('feedback_data_diri_id');
        table.index('sub_responden_id');
        table.index('nilai_rating');
        table.index(['feedback_data_diri_id', 'sub_responden_id']);
        table.unique(['feedback_data_diri_id', 'sub_responden_id']);
    });
    await knex.raw(`
    CREATE VIEW rating_statistics AS
    SELECT 
      sr.responden_id,
      sr.pertanyaan,
      sr.id as sub_responden_id,
      COUNT(ur.id) as total_responses,
      AVG(ur.nilai_rating) as avg_rating,
      MIN(ur.nilai_rating) as min_rating,
      MAX(ur.nilai_rating) as max_rating,
      COUNT(CASE WHEN ur.nilai_rating >= 4 THEN 1 END) as positive_responses,
      COUNT(CASE WHEN ur.nilai_rating <= 2 THEN 1 END) as negative_responses
    FROM sub_responden sr
    LEFT JOIN user_responded ur ON sr.id = ur.sub_responden_id
    LEFT JOIN feedback_data_diri fdd ON ur.feedback_data_diri_id = fdd.id
    WHERE sr.is_active = 1 AND (fdd.status_feedback = 'submitted' OR fdd.status_feedback = 'reviewed')
    GROUP BY sr.id, sr.responden_id, sr.pertanyaan
  `);
}
async function down(knex) {
    await knex.raw('DROP VIEW IF EXISTS rating_statistics');
    await knex.schema.dropTableIfExists('user_responded');
}
//# sourceMappingURL=20250110_091100_create_user_responded.js.map