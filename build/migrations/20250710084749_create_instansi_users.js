"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('instansi_users', function (table) {
        table.uuid('id').primary().notNullable();
        table.uuid('user_id').notNullable();
        table.string('nama_instansi', 255).notNullable();
        table.string('logo_instansi', 500).nullable();
        table.uuid('kategori_id').nullable();
        table.string('alamat_instansi', 500).nullable();
        table.string('deskripsi_instansi', 1000).nullable();
        table.string('website', 255).nullable();
        table.string('email_instansi', 255).nullable();
        table.string('no_telp_instansi', 50).nullable();
        table.bigInteger("created_at");
        table.bigInteger("updated_at");
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.index('user_id');
        table.index('kategori_id');
    });
}
async function down(knex) {
    await knex.schema.dropTable('instansi_users');
}
//# sourceMappingURL=20250710084749_create_instansi_users.js.map