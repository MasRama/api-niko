"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasTable = await knex.schema.hasTable('responden');
    if (hasTable)
        return;
    await knex.schema.createTable('responden', (table) => {
        table.increments('id').primary();
        table.string('tipe_responden', 100).notNullable();
        table.text('deskripsi').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.index(['tipe_responden']);
        table.index(['is_active']);
    });
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
async function down(knex) {
    await knex.schema.dropTableIfExists('responden');
}
//# sourceMappingURL=20250710084763_create_responden.js.map