import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('instansi_users', (table) => {
    // Add foreign key constraint to kategori_instansi
    table.foreign('kategori_id').references('id').inTable('kategori_instansi').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('instansi_users', (table) => {
    table.dropForeign(['kategori_id']);
  });
} 