"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('booking_waktu', (table) => {
        table.increments('id').primary();
        table.integer('prasarana_booking_id').unsigned().notNullable();
        table.integer('waktu_booking_id').unsigned().notNullable();
        table.string('status', 20).defaultTo('booked');
        table.timestamps(true, true);
        table.foreign('prasarana_booking_id').references('id').inTable('prasarana_bookings').onDelete('CASCADE');
        table.foreign('waktu_booking_id').references('id').inTable('waktu_booking').onDelete('CASCADE');
        table.unique(['prasarana_booking_id', 'waktu_booking_id']);
        table.index(['prasarana_booking_id']);
        table.index(['waktu_booking_id']);
        table.index(['status']);
    });
    await knex.raw(`
    CREATE VIEW IF NOT EXISTS prasarana_availability AS
    SELECT 
      p.id as prasarana_id,
      p.nama_prasarana,
      pb.tanggal_penggunaan,
      wb.id as waktu_booking_id,
      wb.waktu_mulai,
      wb.waktu_selesai,
      wb.label,
      CASE 
        WHEN bw.id IS NOT NULL THEN 0 
        ELSE 1 
      END as is_available,
      be.status_persetujuan,
      be.nama_event
    FROM prasarana_mcc p
    CROSS JOIN waktu_booking wb
    LEFT JOIN prasarana_bookings pb ON p.id = pb.prasarana_mcc_id
    LEFT JOIN booking_waktu bw ON pb.id = bw.prasarana_booking_id AND wb.id = bw.waktu_booking_id
    LEFT JOIN booking_events be ON pb.booking_event_id = be.id
    WHERE p.is_bookable = 1 AND p.is_active = 1 AND wb.is_active = 1
    ORDER BY p.nama_prasarana, pb.tanggal_penggunaan, wb.waktu_mulai
  `);
}
async function down(knex) {
    await knex.raw('DROP VIEW IF EXISTS prasarana_availability');
    await knex.schema.dropTableIfExists('booking_waktu');
}
//# sourceMappingURL=20250710084761_create_booking_waktu.js.map