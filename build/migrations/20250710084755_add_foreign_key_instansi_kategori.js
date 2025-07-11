"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.raw('DROP VIEW IF EXISTS facility_rating_statistics');
    await knex.schema.alterTable('instansi_users', (table) => {
        table.foreign('kategori_id').references('id').inTable('kategori_instansi').onDelete('SET NULL');
    });
}
async function down(knex) {
    await knex.schema.alterTable('instansi_users', (table) => {
        table.dropForeign(['kategori_id']);
    });
}
//# sourceMappingURL=20250710084755_add_foreign_key_instansi_kategori.js.map