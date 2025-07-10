import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create function to check booking conflicts
  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS prevent_double_booking
    BEFORE INSERT ON booking_waktu
    FOR EACH ROW
    BEGIN
      -- Check if the time slot is already booked for the same prasarana and date
      SELECT CASE
        WHEN EXISTS (
          SELECT 1 
          FROM booking_waktu bw
          JOIN prasarana_bookings pb1 ON bw.prasarana_booking_id = pb1.id
          JOIN prasarana_bookings pb2 ON pb2.id = NEW.prasarana_booking_id
          WHERE bw.waktu_booking_id = NEW.waktu_booking_id
            AND pb1.prasarana_mcc_id = pb2.prasarana_mcc_id
            AND pb1.tanggal_penggunaan = pb2.tanggal_penggunaan
            AND bw.status = 'booked'
            AND pb1.status = 'active'
        )
        THEN RAISE(ABORT, 'Time slot already booked for this prasarana on this date')
      END;
    END;
  `);

  // Create index for fast conflict checking
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_booking_conflict_check 
    ON prasarana_bookings (prasarana_mcc_id, tanggal_penggunaan, status);
  `);

  // Create index for booking status queries
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_booking_events_status_date 
    ON booking_events (status_persetujuan, created_at);
  `);

  // Create materialized view for booking statistics (simulate with table for SQLite)
  await knex.schema.createTable('booking_statistics', (table) => {
    table.date('tanggal').primary();
    table.integer('total_bookings').defaultTo(0);
    table.integer('approved_bookings').defaultTo(0);
    table.integer('pending_bookings').defaultTo(0);
    table.integer('rejected_bookings').defaultTo(0);
    table.integer('total_prasarana_booked').defaultTo(0);
    table.timestamps(true, true);
  });

  // Create trigger to update booking statistics
  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS update_booking_stats_insert
    AFTER INSERT ON booking_events
    FOR EACH ROW
    BEGIN
      INSERT OR REPLACE INTO booking_statistics (
        tanggal, 
        total_bookings, 
        approved_bookings, 
        pending_bookings, 
        rejected_bookings,
        created_at,
        updated_at
      )
      VALUES (
        date(NEW.created_at),
        COALESCE((SELECT total_bookings FROM booking_statistics WHERE tanggal = date(NEW.created_at)), 0) + 1,
        COALESCE((SELECT approved_bookings FROM booking_statistics WHERE tanggal = date(NEW.created_at)), 0) + 
          CASE WHEN NEW.status_persetujuan = 'approved' THEN 1 ELSE 0 END,
        COALESCE((SELECT pending_bookings FROM booking_statistics WHERE tanggal = date(NEW.created_at)), 0) + 
          CASE WHEN NEW.status_persetujuan = 'pending' THEN 1 ELSE 0 END,
        COALESCE((SELECT rejected_bookings FROM booking_statistics WHERE tanggal = date(NEW.created_at)), 0) + 
          CASE WHEN NEW.status_persetujuan = 'rejected' THEN 1 ELSE 0 END,
        datetime('now'),
        datetime('now')
      );
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER IF NOT EXISTS update_booking_stats_update
    AFTER UPDATE ON booking_events
    FOR EACH ROW
    WHEN OLD.status_persetujuan != NEW.status_persetujuan
    BEGIN
      UPDATE booking_statistics 
      SET 
        approved_bookings = approved_bookings + 
          CASE WHEN NEW.status_persetujuan = 'approved' THEN 1 ELSE 0 END -
          CASE WHEN OLD.status_persetujuan = 'approved' THEN 1 ELSE 0 END,
        pending_bookings = pending_bookings + 
          CASE WHEN NEW.status_persetujuan = 'pending' THEN 1 ELSE 0 END -
          CASE WHEN OLD.status_persetujuan = 'pending' THEN 1 ELSE 0 END,
        rejected_bookings = rejected_bookings + 
          CASE WHEN NEW.status_persetujuan = 'rejected' THEN 1 ELSE 0 END -
          CASE WHEN OLD.status_persetujuan = 'rejected' THEN 1 ELSE 0 END,
        updated_at = datetime('now')
      WHERE tanggal = date(NEW.created_at);
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS prevent_double_booking');
  await knex.raw('DROP TRIGGER IF EXISTS update_booking_stats_insert');
  await knex.raw('DROP TRIGGER IF EXISTS update_booking_stats_update');
  await knex.raw('DROP INDEX IF EXISTS idx_booking_conflict_check');
  await knex.raw('DROP INDEX IF EXISTS idx_booking_events_status_date');
  await knex.schema.dropTableIfExists('booking_statistics');
} 