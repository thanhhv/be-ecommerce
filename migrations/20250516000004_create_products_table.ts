import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description').nullable();
    table.string('brand', 255).nullable();
    table
      .uuid('category_id')
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    table.integer('base_price').notNullable();
    table.integer('sale_price').nullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.index(['category_id']);
    table.index(['is_active', 'deleted_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
}
