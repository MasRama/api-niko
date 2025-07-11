import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', function (table) {
        // Tambahkan kolom alamat bila belum ada
        table.string('alamat', 500).nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', function (table) {
        table.dropColumn('alamat');
    });
} 