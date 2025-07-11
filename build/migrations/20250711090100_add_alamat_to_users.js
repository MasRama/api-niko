"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('users', function (table) {
        table.string('alamat', 500).nullable();
    });
}
async function down(knex) {
    await knex.schema.alterTable('users', function (table) {
        table.dropColumn('alamat');
    });
}
//# sourceMappingURL=20250711090100_add_alamat_to_users.js.map