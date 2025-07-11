"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const addColumn = async (col, cb) => {
        const exists = await knex.schema.hasColumn('sessions', col);
        if (!exists) {
            await knex.schema.alterTable('sessions', cb);
        }
    };
    await addColumn('access_token', (t) => t.text('access_token').nullable());
    await addColumn('refresh_token', (t) => t.text('refresh_token').nullable());
    await addColumn('expires_at', (t) => t.dateTime('expires_at').nullable());
    await addColumn('refresh_expires_at', (t) => t.dateTime('refresh_expires_at').nullable());
    await addColumn('device_type', (t) => t.string('device_type', 50).nullable());
    await addColumn('device_id', (t) => t.string('device_id', 100).nullable());
    await addColumn('fcm_token', (t) => t.string('fcm_token', 500).nullable());
}
async function down(knex) {
    await knex.schema.alterTable('sessions', (table) => {
        table.dropColumn('access_token');
        table.dropColumn('refresh_token');
        table.dropColumn('expires_at');
        table.dropColumn('refresh_expires_at');
        table.dropColumn('device_type');
        table.dropColumn('device_id');
        table.dropColumn('fcm_token');
    });
}
//# sourceMappingURL=20250710090500_extend_sessions.js.map