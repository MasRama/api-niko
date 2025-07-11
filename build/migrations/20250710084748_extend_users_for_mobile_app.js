"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('users', function (table) {
        table.string('foto', 500).nullable();
        table.string('alamat', 500).nullable();
        table.string('jenis_kelamin_personal', 50).nullable();
        table.integer('umur').nullable();
        table.text('deskripsi').nullable();
        table.string('facebook', 255).nullable();
        table.string('instagram', 255).nullable();
        table.string('twitter', 255).nullable();
        table.string('youtube', 255).nullable();
        table.string('tiktok', 255).nullable();
        table.string('fcm_token', 500).nullable();
        table.boolean('is_verified_user').defaultTo(false);
    });
}
async function down(knex) {
    await knex.schema.alterTable('users', function (table) {
        table.dropColumn('foto');
        table.dropColumn('alamat');
        table.dropColumn('jenis_kelamin_personal');
        table.dropColumn('umur');
        table.dropColumn('deskripsi');
        table.dropColumn('facebook');
        table.dropColumn('instagram');
        table.dropColumn('twitter');
        table.dropColumn('youtube');
        table.dropColumn('tiktok');
        table.dropColumn('fcm_token');
        table.dropColumn('is_verified_user');
    });
}
//# sourceMappingURL=20250710084748_extend_users_for_mobile_app.js.map