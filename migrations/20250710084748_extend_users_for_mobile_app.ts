import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', function (table) {
        // Field tambahan untuk personal users
        table.string('foto', 500).nullable(); // Path ke file foto
        table.string('alamat', 500).nullable();
        table.string('jenis_kelamin_personal', 50).nullable();
        table.integer('umur').nullable();
        table.text('deskripsi').nullable();
        
        // Social media fields
        table.string('facebook', 255).nullable();
        table.string('instagram', 255).nullable();
        table.string('twitter', 255).nullable();
        table.string('youtube', 255).nullable();
        table.string('tiktok', 255).nullable();
        
        // Mobile app specific fields
        table.string('fcm_token', 500).nullable(); // Firebase Cloud Messaging token
        table.boolean('is_verified_user').defaultTo(false); // Email verification status
    });
}

export async function down(knex: Knex): Promise<void> {
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