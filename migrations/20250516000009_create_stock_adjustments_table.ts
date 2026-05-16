import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('stock_adjustments', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.integer('quantity_change').notNullable();
    table.string('reason', 500).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_adjustments');
}
