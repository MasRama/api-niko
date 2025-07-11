"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.string('linkedin', 255).nullable();
        table.string('website', 255).nullable();
    });
}
async function down(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('linkedin');
        table.dropColumn('website');
    });
}
//# sourceMappingURL=20250710090000_add_linkedin_website_to_users.js.map