import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sessions', (table) => {
    // Add new columns for JWT token management
    table.text('refresh_token').nullable();
    table.timestamp('expires_at').nullable();
    table.string('device_type', 50).nullable(); // mobile, web, etc
    table.string('device_id', 255).nullable(); // unique device identifier
    table.text('fcm_token').nullable(); // for push notifications
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Add indexes for better performance
    table.index(['refresh_token']);
    table.index(['expires_at']);
    table.index(['device_id']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sessions', (table) => {
    table.dropColumn('refresh_token');
    table.dropColumn('expires_at');
    table.dropColumn('device_type');
    table.dropColumn('device_id');
    table.dropColumn('fcm_token');
    table.dropColumn('is_active');
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
} 