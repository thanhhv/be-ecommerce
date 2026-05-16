import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.uuid('parent_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
    table.text('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('categories');
}
