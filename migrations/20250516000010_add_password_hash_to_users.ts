import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).nullable();
    table.string('provider_id', 255).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('password_hash');
    table.string('provider_id', 255).notNullable().alter();
  });
}
