import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('admin_notifications', (table) => {
    table.uuid('id').primary();
    table.string('type', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.uuid('ref_id').nullable();
    table.string('ref_type', 50).nullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('admin_notifications');
}
