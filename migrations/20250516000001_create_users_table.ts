import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('name', 255).nullable();
    table.string('phone', 50).nullable();
    table.text('address').nullable();
    table.text('avatar_url').nullable();
    table.string('provider', 50).notNullable();
    table.string('provider_id', 255).notNullable();
    table.string('role', 20).notNullable().defaultTo('user');
    table.timestamps(true, true);
    table.index(['provider', 'provider_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
