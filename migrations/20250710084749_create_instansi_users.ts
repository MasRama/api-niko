import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('instansi_users', function (table) {
        table.uuid('id').primary().notNullable();
        table.uuid('user_id').notNullable();
        table.string('nama_instansi', 255).notNullable();
        table.string('logo_instansi', 500).nullable(); // Path ke file logo
        table.uuid('kategori_id').nullable(); // Foreign key ke kategori_instansi
        table.string('alamat_instansi', 500).nullable();
        table.string('deskripsi_instansi', 1000).nullable();
        table.string('website', 255).nullable();
        table.string('email_instansi', 255).nullable();
        table.string('no_telp_instansi', 50).nullable();
        
        // Timestamps
        table.bigInteger("created_at");
        table.bigInteger("updated_at");
        
        // Foreign key constraint
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        
        // Indexes
        table.index('user_id');
        table.index('kategori_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('instansi_users');
} 