import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.string('payment_method', 20).notNullable();
    table.integer('subtotal').notNullable();
    table.integer('shipping_fee').notNullable().defaultTo(0);
    table.integer('total').notNullable();
    table.string('shipping_name', 255).notNullable();
    table.string('shipping_phone', 20).notNullable();
    table.text('shipping_address').notNullable();
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['user_id', 'created_at']);
    table.index('status');
  });

  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.uuid('product_id').nullable().references('id').inTable('products').onDelete('SET NULL');
    table.string('product_name_snapshot', 255).notNullable();
    table.string('product_image_snapshot', 500).nullable();
    table.integer('quantity').notNullable();
    table.integer('unit_price').notNullable();
    table.integer('total_price').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
}
