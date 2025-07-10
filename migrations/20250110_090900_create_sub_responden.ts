import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sub_responden', (table) => {
    table.increments('id').primary();
    table.integer('responden_id').unsigned().notNullable();
    table.text('pertanyaan').notNullable();
    table.integer('nilai_awal').notNullable().defaultTo(1);
    table.integer('nilai_akhir').notNullable().defaultTo(5);
    table.string('tipe_input', 50).notNullable().defaultTo('rating'); // rating, scale, boolean
    table.text('keterangan').nullable();
    table.integer('urutan').notNullable().defaultTo(1);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('responden_id').references('id').inTable('responden').onDelete('CASCADE');
    
    // Indexes
    table.index('responden_id');
    table.index('is_active');
    table.index('urutan');
  });

  // Insert default questions for each responden type
  const respondenTypes = await knex('responden').select('id', 'tipe_responden');
  
  for (const responden of respondenTypes) {
    if (responden.tipe_responden === 'Pengguna Fasilitas') {
      await knex('sub_responden').insert([
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana tingkat kepuasan Anda terhadap fasilitas yang digunakan?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 1
        },
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana kebersihan fasilitas yang Anda gunakan?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 2
        },
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana pelayanan staff MCC?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 3
        }
      ]);
    } else if (responden.tipe_responden === 'Pengunjung Event') {
      await knex('sub_responden').insert([
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana kepuasan Anda terhadap event yang diselenggarakan?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 1
        },
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana kualitas penyelenggaraan event?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 2
        },
        {
          responden_id: responden.id,
          pertanyaan: 'Apakah Anda akan merekomendasikan event serupa?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 3
        }
      ]);
    } else if (responden.tipe_responden === 'Tenant/Penyewa') {
      await knex('sub_responden').insert([
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana kepuasan Anda terhadap layanan MCC?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 1
        },
        {
          responden_id: responden.id,
          pertanyaan: 'Bagaimana kondisi infrastruktur yang disewa?',
          nilai_awal: 1,
          nilai_akhir: 5,
          tipe_input: 'rating',
          urutan: 2
        }
      ]);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sub_responden');
} 