import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sdgs', (table) => {
    table.increments('id').primary();
    table.string('nama_sdgs', 200).notNullable();
    table.text('deskripsi').nullable();
    table.integer('nomor_sdgs').notNullable().unique();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['nomor_sdgs']);
    table.index(['is_active']);
    table.index(['nama_sdgs']);
  });

  // Insert all 17 SDGs (Sustainable Development Goals)
  await knex('sdgs').insert([
    {
      nomor_sdgs: 1,
      nama_sdgs: 'No Poverty',
      deskripsi: 'Mengakhiri kemiskinan dalam segala bentuk di mana pun',
      is_active: true
    },
    {
      nomor_sdgs: 2,
      nama_sdgs: 'Zero Hunger',
      deskripsi: 'Mengakhiri kelaparan, mencapai ketahanan pangan dan gizi yang baik, serta meningkatkan pertanian berkelanjutan',
      is_active: true
    },
    {
      nomor_sdgs: 3,
      nama_sdgs: 'Good Health and Well-being',
      deskripsi: 'Memastikan kehidupan yang sehat dan meningkatkan kesejahteraan untuk semua di segala usia',
      is_active: true
    },
    {
      nomor_sdgs: 4,
      nama_sdgs: 'Quality Education',
      deskripsi: 'Memastikan pendidikan yang inklusif dan berkualitas serta mendorong kesempatan belajar seumur hidup untuk semua',
      is_active: true
    },
    {
      nomor_sdgs: 5,
      nama_sdgs: 'Gender Equality',
      deskripsi: 'Mencapai kesetaraan gender dan memberdayakan semua perempuan dan anak perempuan',
      is_active: true
    },
    {
      nomor_sdgs: 6,
      nama_sdgs: 'Clean Water and Sanitation',
      deskripsi: 'Memastikan ketersediaan dan pengelolaan air bersih dan sanitasi yang berkelanjutan untuk semua',
      is_active: true
    },
    {
      nomor_sdgs: 7,
      nama_sdgs: 'Affordable and Clean Energy',
      deskripsi: 'Memastikan akses energi yang terjangkau, dapat diandalkan, berkelanjutan dan modern untuk semua',
      is_active: true
    },
    {
      nomor_sdgs: 8,
      nama_sdgs: 'Decent Work and Economic Growth',
      deskripsi: 'Mendorong pertumbuhan ekonomi yang berkelanjutan dan inklusif, tenaga kerja penuh dan produktif, serta pekerjaan yang layak untuk semua',
      is_active: true
    },
    {
      nomor_sdgs: 9,
      nama_sdgs: 'Industry, Innovation and Infrastructure',
      deskripsi: 'Membangun infrastruktur yang tangguh, mendorong industrialisasi yang inklusif dan berkelanjutan, serta mendorong inovasi',
      is_active: true
    },
    {
      nomor_sdgs: 10,
      nama_sdgs: 'Reduced Inequality',
      deskripsi: 'Mengurangi ketimpangan di dalam dan antar negara',
      is_active: true
    },
    {
      nomor_sdgs: 11,
      nama_sdgs: 'Sustainable Cities and Communities',
      deskripsi: 'Membuat kota dan pemukiman manusia inklusif, aman, tangguh, dan berkelanjutan',
      is_active: true
    },
    {
      nomor_sdgs: 12,
      nama_sdgs: 'Responsible Consumption and Production',
      deskripsi: 'Memastikan pola konsumsi dan produksi yang berkelanjutan',
      is_active: true
    },
    {
      nomor_sdgs: 13,
      nama_sdgs: 'Climate Action',
      deskripsi: 'Mengambil tindakan segera untuk memerangi perubahan iklim dan dampaknya',
      is_active: true
    },
    {
      nomor_sdgs: 14,
      nama_sdgs: 'Life Below Water',
      deskripsi: 'Melestarikan dan memanfaatkan secara berkelanjutan samudra, laut, dan sumber daya kelautan untuk pembangunan berkelanjutan',
      is_active: true
    },
    {
      nomor_sdgs: 15,
      nama_sdgs: 'Life on Land',
      deskripsi: 'Melindungi, memulihkan, dan mendorong penggunaan berkelanjutan ekosistem darat',
      is_active: true
    },
    {
      nomor_sdgs: 16,
      nama_sdgs: 'Peace and Justice Strong Institutions',
      deskripsi: 'Mendorong masyarakat yang damai dan inklusif untuk pembangunan berkelanjutan',
      is_active: true
    },
    {
      nomor_sdgs: 17,
      nama_sdgs: 'Partnerships to achieve the Goal',
      deskripsi: 'Memperkuat sarana pelaksanaan dan merevitalisasi kemitraan global untuk pembangunan berkelanjutan',
      is_active: true
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sdgs');
} 