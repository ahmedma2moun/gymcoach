/**
 * Migration runner — run with: node server/migrate.js  (or: npm run migrate)
 *
 * Uses @supabase/supabase-js to execute migrations via the Supabase REST API.
 * Bootstraps a `migrations` tracking table, then executes any pending
 * migrations in order.  Safe to run multiple times (idempotent).
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { up as migration001 } from './migrations/001_initial.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
    { name: '001_initial', sql: migration001 }
];

/** Execute raw SQL via Supabase REST API */
async function sql(query) {
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SQL error (${response.status}): ${text}`);
    }

    return response.json().catch(() => null);
}

const run = async () => {
    console.log('Connecting to Supabase...');

    // Bootstrap tracking table
    await sql(`
        CREATE TABLE IF NOT EXISTS migrations (
            id      SERIAL      PRIMARY KEY,
            name    TEXT        NOT NULL UNIQUE,
            ran_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    for (const migration of migrations) {
        // Check if already ran
        const { data, error } = await supabase
            .from('migrations')
            .select('name')
            .eq('name', migration.name)
            .maybeSingle();

        if (error) throw new Error(`Migration check failed: ${error.message}`);

        if (data) {
            console.log(`  skip  ${migration.name} (already ran)`);
            continue;
        }

        console.log(`  run   ${migration.name} ...`);
        await sql(migration.sql);

        const { error: insertError } = await supabase
            .from('migrations')
            .insert({ name: migration.name });

        if (insertError) throw new Error(`Migration record failed: ${insertError.message}`);
        console.log(`  done  ${migration.name}`);
    }

    console.log('\nAll migrations up to date.');
};

run().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
