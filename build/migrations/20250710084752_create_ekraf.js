"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('ekraf', (table) => {
        table.increments('id').primary();
        table.string('nama_ekraf', 100).notNullable();
        table.text('deskripsi').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.index(['nama_ekraf']);
        table.index(['is_active']);
    });
    await knex('ekraf').insert([
        {
            nama_ekraf: 'Aplikasi dan Game Developer',
            deskripsi: 'Pengembangan aplikasi dan permainan digital',
            is_active: true
        },
        {
            nama_ekraf: 'Arsitektur',
            deskripsi: 'Desain arsitektur dan perencanaan bangunan',
            is_active: true
        },
        {
            nama_ekraf: 'Desain Interior',
            deskripsi: 'Desain dan penataan ruang interior',
            is_active: true
        },
        {
            nama_ekraf: 'Desain Komunikasi Visual',
            deskripsi: 'Desain grafis dan komunikasi visual',
            is_active: true
        },
        {
            nama_ekraf: 'Desain Produk',
            deskripsi: 'Desain dan pengembangan produk',
            is_active: true
        },
        {
            nama_ekraf: 'Fashion',
            deskripsi: 'Industri mode dan busana',
            is_active: true
        },
        {
            nama_ekraf: 'Film, Animasi dan Video',
            deskripsi: 'Produksi film, animasi, dan konten video',
            is_active: true
        },
        {
            nama_ekraf: 'Fotografi',
            deskripsi: 'Jasa dan karya fotografi',
            is_active: true
        },
        {
            nama_ekraf: 'Kriya',
            deskripsi: 'Kerajinan tangan dan seni kriya',
            is_active: true
        },
        {
            nama_ekraf: 'Kuliner',
            deskripsi: 'Industri makanan dan minuman kreatif',
            is_active: true
        },
        {
            nama_ekraf: 'Musik',
            deskripsi: 'Industri musik dan audio',
            is_active: true
        },
        {
            nama_ekraf: 'Penerbitan',
            deskripsi: 'Industri penerbitan dan publikasi',
            is_active: true
        },
        {
            nama_ekraf: 'Periklanan',
            deskripsi: 'Industri periklanan dan promosi',
            is_active: true
        },
        {
            nama_ekraf: 'Seni Pertunjukan',
            deskripsi: 'Seni teater, tari, dan pertunjukan',
            is_active: true
        },
        {
            nama_ekraf: 'Seni Rupa',
            deskripsi: 'Seni lukis, patung, dan karya seni rupa',
            is_active: true
        },
        {
            nama_ekraf: 'Televisi dan Radio',
            deskripsi: 'Industri penyiaran televisi dan radio',
            is_active: true
        },
        {
            nama_ekraf: 'Lainnya',
            deskripsi: 'Bidang ekonomi kreatif lainnya',
            is_active: true
        }
    ]);
}
async function down(knex) {
    await knex.schema.dropTableIfExists('ekraf');
}
//# sourceMappingURL=20250710084752_create_ekraf.js.map