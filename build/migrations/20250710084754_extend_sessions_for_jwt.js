"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('sessions', (table) => {
        table.text('refresh_token').nullable();
        table.timestamp('expires_at').nullable();
        table.string('device_type', 50).nullable();
        table.string('device_id', 255).nullable();
        table.text('fcm_token').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
        table.index(['refresh_token']);
        table.index(['expires_at']);
        table.index(['device_id']);
        table.index(['is_active']);
    });
}
async function down(knex) {
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
//# sourceMappingURL=20250710084754_extend_sessions_for_jwt.js.map