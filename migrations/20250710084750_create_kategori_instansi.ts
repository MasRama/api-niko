import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('kategori_instansi', function (table) {
        table.uuid('id').primary().notNullable();
        table.string('nama', 255).notNullable();
        table.string('deskripsi', 500).nullable();
        table.boolean('is_active').defaultTo(true);
        
        // Timestamps
        table.bigInteger("created_at");
        table.bigInteger("updated_at");
        
        // Indexes
        table.index('nama');
    });
    
    // Insert default categories
    await knex('kategori_instansi').insert([
        {
            id: knex.raw(`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
            nama: 'Pemerintah',
            deskripsi: 'Instansi pemerintahan',
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
        },
        {
            id: knex.raw(`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
            nama: 'Swasta',
            deskripsi: 'Perusahaan swasta',
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
        },
        {
            id: knex.raw(`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
            nama: 'Pendidikan',
            deskripsi: 'Institusi pendidikan',
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
        },
        {
            id: knex.raw(`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`),
            nama: 'Organisasi',
            deskripsi: 'Organisasi non-profit',
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
        }
    ]);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('kategori_instansi');
} 