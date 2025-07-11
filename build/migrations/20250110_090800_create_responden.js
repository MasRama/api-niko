"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('responden', (table) => {
        table.increments('id').primary();
        table.string('tipe_responden', 100).notNullable().unique();
        table.text('deskripsi').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.index('tipe_responden');
        table.index('is_active');
    });
    await knex('responden').insert([
        {
            tipe_responden: 'Pengguna Fasilitas',
            deskripsi: 'Pengguna yang menggunakan fasilitas MCC',
            is_active: true
        },
        {
            tipe_responden: 'Pengunjung Event',
            deskripsi: 'Pengunjung yang menghadiri event di MCC',
            is_active: true
        },
        {
            tipe_responden: 'Tenant/Penyewa',
            deskripsi: 'Tenant atau penyewa ruangan di MCC',
            is_active: true
        },
        {
            tipe_responden: 'Mitra Bisnis',
            deskripsi: 'Mitra bisnis atau kolaborator MCC',
            is_active: true
        },
        {
            tipe_responden: 'Umum',
            deskripsi: 'Responden umum lainnya',
            is_active: true
        }
    ]);
}
async function down(knex) {
    await knex.schema.dropTableIfExists('responden');
}
//# sourceMappingURL=20250110_090800_create_responden.js.map