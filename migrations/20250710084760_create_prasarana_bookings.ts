import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prasarana_bookings', (table) => {
    table.increments('id').primary();
    table.uuid('booking_event_id').notNullable();
    table.integer('prasarana_mcc_id').unsigned().notNullable();
    table.date('tanggal_penggunaan').notNullable();
    table.string('status', 20).defaultTo('active'); // active, cancelled
    table.text('catatan').nullable(); // notes for this specific room booking
    table.timestamps(true, true);
    
    // Foreign key constraints
    table.foreign('booking_event_id').references('id').inTable('booking_events').onDelete('CASCADE');
    table.foreign('prasarana_mcc_id').references('id').inTable('prasarana_mcc').onDelete('CASCADE');
    
    // Indexes for performance
    table.index(['booking_event_id']);
    table.index(['prasarana_mcc_id']);
    table.index(['tanggal_penggunaan']);
    table.index(['status']);
    
    // Composite index for efficient queries
    table.index(['prasarana_mcc_id', 'tanggal_penggunaan']);
    table.index(['booking_event_id', 'tanggal_penggunaan']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('prasarana_bookings');
} 