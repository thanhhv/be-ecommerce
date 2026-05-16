import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('product_images', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.text('url').notNullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.index(['product_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_images');
}
