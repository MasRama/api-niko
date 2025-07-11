"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('kategori_event', (table) => {
        table.increments('id').primary();
        table.string('nama_kategori', 100).notNullable();
        table.text('deskripsi').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.index(['nama_kategori']);
        table.index(['is_active']);
    });
    await knex('kategori_event').insert([
        {
            nama_kategori: 'Workshop',
            deskripsi: 'Kegiatan pelatihan dan pembelajaran',
            is_active: true
        },
        {
            nama_kategori: 'Seminar',
            deskripsi: 'Kegiatan seminar dan diskusi',
            is_active: true
        },
        {
            nama_kategori: 'Pameran',
            deskripsi: 'Kegiatan pameran dan display',
            is_active: true
        },
        {
            nama_kategori: 'Konferensi',
            deskripsi: 'Kegiatan konferensi dan pertemuan besar',
            is_active: true
        },
        {
            nama_kategori: 'Festival',
            deskripsi: 'Kegiatan festival dan perayaan',
            is_active: true
        },
        {
            nama_kategori: 'Kompetisi',
            deskripsi: 'Kegiatan kompetisi dan lomba',
            is_active: true
        },
        {
            nama_kategori: 'Pelatihan',
            deskripsi: 'Kegiatan pelatihan keterampilan',
            is_active: true
        },
        {
            nama_kategori: 'Lainnya',
            deskripsi: 'Kategori event lainnya',
            is_active: true
        }
    ]);
}
async function down(knex) {
    await knex.schema.dropTableIfExists('kategori_event');
}
//# sourceMappingURL=20250710084751_create_kategori_event.js.map