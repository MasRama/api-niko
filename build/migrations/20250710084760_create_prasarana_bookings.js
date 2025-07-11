"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('prasarana_bookings', (table) => {
        table.increments('id').primary();
        table.uuid('booking_event_id').notNullable();
        table.integer('prasarana_mcc_id').unsigned().notNullable();
        table.date('tanggal_penggunaan').notNullable();
        table.string('status', 20).defaultTo('active');
        table.text('catatan').nullable();
        table.timestamps(true, true);
        table.foreign('booking_event_id').references('id').inTable('booking_events').onDelete('CASCADE');
        table.foreign('prasarana_mcc_id').references('id').inTable('prasarana_mcc').onDelete('CASCADE');
        table.index(['booking_event_id']);
        table.index(['prasarana_mcc_id']);
        table.index(['tanggal_penggunaan']);
        table.index(['status']);
        table.index(['prasarana_mcc_id', 'tanggal_penggunaan']);
        table.index(['booking_event_id', 'tanggal_penggunaan']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('prasarana_bookings');
}
//# sourceMappingURL=20250710084760_create_prasarana_bookings.js.map