"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('feedback_data_diri', (table) => {
        table.increments('id').primary();
        table.integer('account_id').unsigned().nullable();
        table.integer('booking_event_id').unsigned().nullable();
        table.integer('responden_id').unsigned().notNullable();
        table.string('nama', 100).notNullable();
        table.string('email', 100).notNullable();
        table.string('no_telp', 20).notNullable();
        table.string('instansi', 150).nullable();
        table.string('jabatan', 100).nullable();
        table.text('alamat').nullable();
        table.date('tanggal_feedback').notNullable();
        table.enum('status_feedback', ['draft', 'submitted', 'reviewed']).defaultTo('draft');
        table.text('catatan_admin').nullable();
        table.timestamps(true, true);
        table.foreign('account_id').references('id').inTable('users').onDelete('SET NULL');
        table.foreign('booking_event_id').references('id').inTable('booking_events').onDelete('SET NULL');
        table.foreign('responden_id').references('id').inTable('responden').onDelete('CASCADE');
        table.index('account_id');
        table.index('booking_event_id');
        table.index('responden_id');
        table.index('email');
        table.index('tanggal_feedback');
        table.index('status_feedback');
        table.index(['account_id', 'booking_event_id']);
        table.index(['responden_id', 'status_feedback']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('feedback_data_diri');
}
//# sourceMappingURL=20250110_091000_create_feedback_data_diri.js.map